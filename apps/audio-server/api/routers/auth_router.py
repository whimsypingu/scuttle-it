import traceback

from core.room.room_manager import RoomManager
from fastapi import APIRouter, Body, Cookie, Depends, HTTPException, Query, Response, status

from config import settings

from api.dependencies import get_db_manager, get_room_manager
from database.database_manager import DatabaseManager
from core.models.payloads import LoginPayload
from core.models.responses import AuthResponse, LoginResponse
from fastapi.responses import RedirectResponse


AuthRouter = APIRouter(prefix="/auth", tags=["Authentication"])


@AuthRouter.post("/login")
async def login(
    response: Response,
    payload: LoginPayload = Body(...), #automatically parse JSON body into pydantic model
    db_manager: DatabaseManager = Depends(get_db_manager),
):
    try: 
        is_valid = await db_manager.validate_password(payload.password)

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )

        #attach cookie, guarantee this created auth token has a longer ttl from the default of 1hr
        auth_token = await db_manager.create_cookie_token(settings.TTL_AUTH_TOKEN)

        response.set_cookie(
            key="auth_token",
            value=auth_token,
            max_age=settings.TTL_AUTH_TOKEN,
            httponly=True,
            samesite="lax",
            secure=False,
            path="/"
        )

        #result of login attempt
        return LoginResponse(
            success=True
        )

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )


@AuthRouter.get("/me")
async def get_auth_me(
    response: Response,
    auth_token: str | None = Cookie(None),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        if not auth_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No auth token provided"
            )

        is_auth = await db_manager.validate_refresh_cookie_token(auth_token, settings.TTL_AUTH_TOKEN)

        #remove cookie if not authorized
        if not is_auth:
            response.delete_cookie("auth_token", path="/")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Auth token expired"
            )

        response.set_cookie(
            key="auth_token",
            value=auth_token,
            max_age=settings.TTL_AUTH_TOKEN,
            httponly=True,
            samesite="lax",
            secure=False,
            path="/"
        )

        return AuthResponse(
            success=True
        )

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )


@AuthRouter.get("/j/{ticket_id}")
async def auth_join_room(
    ticket_id: str,
    room_manager: RoomManager = Depends(get_room_manager),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        room_id = await room_manager.redeem_join_ticket(ticket_id)

        #invalid join ticket
        if room_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Join link is expired or invalid"
            )

        auth_token = await db_manager.create_cookie_token(settings.TTL_AUTH_TOKEN)

        #prepare 303 redirect to frontend app with room parameter embedded
        target_url = f"/?r={room_id}"
        response = RedirectResponse(url=target_url, status_code=status.HTTP_303_SEE_OTHER)

        response.set_cookie(
            key="auth_token",
            value=auth_token,
            max_age=settings.TTL_AUTH_TOKEN,
            httponly=True,
            samesite="lax",
            secure=False,
            path="/"
        )

        return response

    except HTTPException:
        raise

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Crashed"
        )
    
