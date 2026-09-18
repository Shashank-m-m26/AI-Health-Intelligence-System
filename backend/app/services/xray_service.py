import torch
import torchxrayvision as xrv
import skimage.io


# ============================================================
# LOAD PRETRAINED X-RAY MODEL
# ============================================================

model = xrv.models.DenseNet(
    weights="densenet121-res224-all"
)


# ============================================================
# USER-FRIENDLY TERMINOLOGY
# ============================================================

UI_TERMINOLOGY = {
    "Atelectasis": {
        "name": "Partial lung collapse pattern",
        "category": "Lungs",
        "description": (
            "A pattern that may be associated with partial collapse "
            "or reduced expansion of part of the lung."
        ),
    },

    "Consolidation": {
        "name": "Increased lung opacity pattern",
        "category": "Lungs",
        "description": (
            "An area of increased density or opacity within the lung "
            "that may have several possible causes."
        ),
    },

    "Infiltration": {
        "name": "Abnormal lung opacity pattern",
        "category": "Lungs",
        "description": (
            "An area of increased lung opacity detected by the model."
        ),
    },

    "Pneumothorax": {
        "name": "Possible collapsed-lung pattern",
        "category": "Lungs",
        "description": (
            "A pattern that may be associated with air outside the lung "
            "and possible lung collapse."
        ),
    },

    "Edema": {
        "name": "Fluid-related lung pattern",
        "category": "Lungs",
        "description": (
            "A pattern that may be associated with increased fluid "
            "within the lungs."
        ),
    },

    "Emphysema": {
        "name": "Emphysema-related lung changes",
        "category": "Lungs",
        "description": (
            "A pattern associated with structural changes in the lungs "
            "that can occur with emphysema."
        ),
    },

    "Fibrosis": {
        "name": "Lung scarring pattern",
        "category": "Lungs",
        "description": (
            "A pattern that may be associated with scarring or fibrotic "
            "changes in lung tissue."
        ),
    },

    "Effusion": {
        "name": "Fluid around the lungs",
        "category": "Lungs",
        "description": (
            "A pattern that may be associated with fluid accumulating "
            "around the lungs."
        ),
    },

    "Pneumonia": {
        "name": "Pneumonia-related pattern",
        "category": "Lungs",
        "description": (
            "A pattern associated with findings that can occur with "
            "pneumonia."
        ),
    },

    "Pleural_Thickening": {
        "name": "Thickening of the lung lining",
        "category": "Lungs",
        "description": (
            "A pattern involving increased thickness of the membrane "
            "surrounding the lungs."
        ),
    },

    "Cardiomegaly": {
        "name": "Enlarged heart pattern",
        "category": "Cardiac",
        "description": (
            "A pattern suggesting that the heart may appear larger "
            "than expected on the X-ray."
        ),
    },

    "Nodule": {
        "name": "Small abnormal spot in the lung",
        "category": "Lungs",
        "description": (
            "A small localized lung finding detected by the model."
        ),
    },

    "Mass": {
        "name": "Larger abnormal growth-like area",
        "category": "Lungs",
        "description": (
            "A larger localized area detected by the model that may "
            "require further clinical evaluation."
        ),
    },

    "Hernia": {
        "name": "Hernia-related pattern",
        "category": "Other",
        "description": (
            "A pattern associated with a possible hernia-related finding."
        ),
    },

    "Lung Lesion": {
        "name": "Abnormal lung lesion pattern",
        "category": "Lungs",
        "description": (
            "A localized abnormal area detected within the lung."
        ),
    },

    "Fracture": {
        "name": "Bone fracture pattern",
        "category": "Other",
        "description": (
            "A pattern that may be associated with a bone fracture."
        ),
    },

    "Lung Opacity": {
        "name": "Abnormal lung opacity",
        "category": "Lungs",
        "description": (
            "An area of increased opacity detected within the lung."
        ),
    },

    "Enlarged Cardiomediastinum": {
        "name": "Widened heart and central chest appearance",
        "category": "Cardiac",
        "description": (
            "A pattern involving an increased width of the central "
            "structures of the chest."
        ),
    },
}


# ============================================================
# INTERPRETATION LAYER
# ============================================================

def interpret_score(score: float):
    """
    Convert a raw model score into a user-friendly interpretation.

    IMPORTANT:
    These are model-score categories, NOT medical diagnoses
    or calibrated probabilities.
    """

    if score >= 0.60:
        return {
            "level": "high",
            "label": "Higher model score",
            "status": "attention",
        }

    elif score >= 0.40:
        return {
            "level": "moderate",
            "label": "Elevated model score",
            "status": "review",
        }

    elif score >= 0.20:
        return {
            "level": "low",
            "label": "Low model score",
            "status": "low",
        }

    else:
        return {
            "level": "very_low",
            "label": "Very low model score",
            "status": "minimal",
        }


# ============================================================
# X-RAY ANALYSIS
# ============================================================

def analyze_xray(file_path: str):

    # --------------------------------------------------------
    # Read image
    # --------------------------------------------------------

    img = skimage.io.imread(file_path)

    # Convert RGB/RGBA image to grayscale
    if img.ndim == 3:
        img = img.mean(2)

    # --------------------------------------------------------
    # Normalize image
    # --------------------------------------------------------

    img = xrv.datasets.normalize(img, 255)

    # Add channel dimension
    img = img[None, ...]

    # --------------------------------------------------------
    # X-ray preprocessing
    # --------------------------------------------------------

    transform = xrv.datasets.XRayCenterCrop()
    img = transform(img)

    transform = xrv.datasets.XRayResizer(224)
    img = transform(img)

    # Convert to PyTorch tensor
    img = torch.from_numpy(img).unsqueeze(0)

    # --------------------------------------------------------
    # Model inference
    # --------------------------------------------------------

    with torch.no_grad():
        outputs = model(img)

    # --------------------------------------------------------
    # Convert model output to raw scores
    # --------------------------------------------------------

    raw_findings = {}

    for pathology, score in zip(model.pathologies, outputs[0]):
        raw_findings[pathology] = float(score)

    # --------------------------------------------------------
    # Create user-friendly observations
    # --------------------------------------------------------

    observations = []

    for pathology, score in raw_findings.items():

        terminology = UI_TERMINOLOGY.get(
            pathology,
            {
                "name": pathology,
                "category": "Other",
                "description": "Finding detected by the AI model.",
            },
        )

        interpretation = interpret_score(score)

        observations.append(
            {
                "technical_name": pathology,
                "name": terminology["name"],
                "category": terminology["category"],
                "score": round(score, 4),
                "interpretation": interpretation["label"],
                "level": interpretation["level"],
                "status": interpretation["status"],
                "description": terminology["description"],
            }
        )

    # --------------------------------------------------------
    # Sort observations by score
    # Highest model scores first
    # --------------------------------------------------------

    observations.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    # --------------------------------------------------------
    # Generate overall summary
    # --------------------------------------------------------

    high_count = sum(
        1 for x in observations
        if x["level"] == "high"
    )

    moderate_count = sum(
        1 for x in observations
        if x["level"] == "moderate"
    )

    if high_count > 0:
        overall_status = "attention"
        overall_text = (
            "The AI model produced higher scores for some findings. "
            "These observations should be reviewed by a qualified "
            "healthcare professional."
        )

    elif moderate_count > 0:
        overall_status = "review"
        overall_text = (
            "The AI model produced elevated scores for some findings. "
            "Professional review may be appropriate."
        )

    else:
        overall_status = "low"
        overall_text = (
            "The AI model did not produce high scores for the analyzed "
            "findings."
        )

    # --------------------------------------------------------
    # Return complete response
    # --------------------------------------------------------

    return {
        "summary": {
            "status": overall_status,
            "text": overall_text,
        },

        "observations": observations,

        # Keep the original raw scores for technical users
        "technical_scores": raw_findings,

        "disclaimer": (
            "This AI analysis is for informational and research "
            "purposes only. Model scores are not medical diagnoses "
            "or confirmed probabilities. Please consult a qualified "
            "healthcare professional for clinical interpretation."
        ),
    }