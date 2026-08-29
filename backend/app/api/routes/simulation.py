from fastapi import APIRouter, BackgroundTasks, HTTPException, status



from app.core.auth import AnyPlatformUser, LenderUser

from app.core.logging import get_logger

from app.services.demo_platform_store import DEMO_REQUEST_ID, demo_store

from app.services.risk_alert_service import evaluate_simulation_risk_alert



router = APIRouter(prefix="/simulation", tags=["Simulation"])

logger = get_logger("simulation")





def _request_id(request_id: str | None) -> str:

    return request_id or DEMO_REQUEST_ID





async def _maybe_notify_n8n(state: dict, user_id: str, user_phone: str | None = None) -> None:

    request_id = state.get("request_id", DEMO_REQUEST_ID)

    req = demo_store._requests.get(request_id)

    if not req:

        return



    try:

        alert_log = await evaluate_simulation_risk_alert(req, state)

        if alert_log.get("alert_triggered") or alert_log.get("notification_status", "").startswith("SKIPPED"):

            demo_store._risk_alerts.insert(0, alert_log)

        if alert_log.get("notification_sent"):

            logger.info(

                "Simulation risk alert sent project=%s phone=%s confidence=%s",

                request_id,

                alert_log.get("recipient_phone"),

                alert_log.get("new_confidence_score"),

            )

        elif alert_log.get("notification_status") == "FAILED":

            logger.warning(

                "Simulation risk alert failed project=%s error=%s",

                request_id,

                alert_log.get("notification_error"),

            )

    except Exception as exc:

        logger.warning("Simulation risk alert error project=%s error=%s", request_id, exc)





@router.get("/{request_id}")

def get_simulation(request_id: str, user: AnyPlatformUser):

    state = demo_store.get_simulation(_request_id(request_id), user.id, user.role)

    if state is None:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")

    return state





@router.post("/{request_id}/start")

def start_simulation(request_id: str, user: AnyPlatformUser):

    result = demo_store.start_simulation(_request_id(request_id), user.id, user.role)

    if result is None:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    state, reassessment = result
    record = reassessment.get("record") if isinstance(reassessment, dict) else reassessment
    return {"state": state, "event": state.get("latest_event"), "reassessment": record}





@router.post("/{request_id}/next")

async def next_event(request_id: str, user: AnyPlatformUser, background_tasks: BackgroundTasks):

    try:

        result = demo_store.next_simulation_event(_request_id(request_id), user.id, user.role)

    except ValueError as exc:

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if result is None:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    state, reassessment = result

    background_tasks.add_task(_maybe_notify_n8n, state, user.id, user.phone)
    record = reassessment.get("record") if isinstance(reassessment, dict) else reassessment
    return {"state": state, "event": state.get("latest_event"), "reassessment": record}





@router.post("/{request_id}/pause")

def pause_simulation(request_id: str, user: AnyPlatformUser):

    state = demo_store.pause_simulation(_request_id(request_id), user.id, user.role)

    if state is None:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")

    return state





@router.post("/{request_id}/resume")

def resume_simulation(request_id: str, user: AnyPlatformUser):

    state = demo_store.resume_simulation(_request_id(request_id), user.id, user.role)

    if state is None:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")

    return state





@router.post("/{request_id}/auto")

def set_auto_simulation(request_id: str, enabled: bool, user: AnyPlatformUser):

    state = demo_store.set_simulation_auto(_request_id(request_id), user.id, user.role, enabled)

    if state is None:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")

    return state





@router.post("/{request_id}/reset")

def reset_simulation(request_id: str, user: AnyPlatformUser):

    state = demo_store.reset_simulation(_request_id(request_id), user.id, user.role)

    if state is None:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    return state


