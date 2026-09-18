import os
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from app.services.xray_service import analyze_xray
from app.utils.auth import get_current_user


router = APIRouter()


@router.post("/analyze")
async def analyze_xray_report(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """
    Analyze an uploaded chest X-ray using a pretrained medical imaging model.
    """

    allowed_types = {
        "image/png",
        "image/jpeg",
        "image/jpg",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PNG or JPEG chest X-ray image."
        )

    suffix = ".png" if file.content_type == "image/png" else ".jpg"

    try:
        contents = await file.read()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            temp_file.write(contents)
            temp_path = temp_file.name

        analysis = analyze_xray(temp_path)

        return {
            "message": "X-ray analysis completed",
            "model": "TorchXRayVision DenseNet121",
            **analysis
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"X-ray analysis failed: {str(e)}"
        )

    finally:
        if "temp_path" in locals() and os.path.exists(temp_path):
            os.remove(temp_path)