from fastapi import APIRouter

router = APIRouter()

@router.get("/orchids")
async def list_orchids():
    return []

def enqueue_refresh(task):
    task.delay()
