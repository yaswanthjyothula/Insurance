"""Read-only views of the Saffron Life catalogue and the sample customers."""

from typing import List, Optional

from fastapi import APIRouter, HTTPException

from app.pack.loader import get_pack
from app.pack.models import Fund, Product, Rider
from app.services.profiles import to_applicant, to_assessment_input, to_recommend_request

router = APIRouter(prefix="/pack", tags=["catalogue"])


@router.get("/products", response_model=List[Product])
def products(product_type: Optional[str] = None):
    items = list(get_pack().products.values())
    return [p for p in items if p.product_type == product_type] if product_type else items


@router.get("/products/{product_id}", response_model=Product)
def product(product_id: str):
    item = get_pack().products.get(product_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return item


@router.get("/riders", response_model=List[Rider])
def riders(product_id: Optional[str] = None):
    items = list(get_pack().riders.values())
    return [r for r in items if product_id in r.available_on_product_ids] if product_id else items


@router.get("/funds", response_model=List[Fund])
def funds(product_id: Optional[str] = None):
    items = list(get_pack().funds.values())
    return [f for f in items if product_id in get_pack().products[product_id].ulip_fund_ids] if product_id in get_pack().products else items


@router.get("/customers")
def customers():
    """Sample customers (all synthetic) for the 'try a sample customer' picker."""
    return [
        {
            "profile_id": p.profile_id,
            "full_name": p.full_name,
            "age": p.age,
            "city": p.city,
            "occupation": p.occupation,
            "annual_income": p.annual_income_inr,
            "risk_appetite": p.risk_appetite,
        }
        for p in get_pack().profiles.values()
    ]


@router.get("/customers/{profile_id}")
def customer(profile_id: str):
    p = get_pack().profiles.get(profile_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "profile": p,
        "assessment": to_assessment_input(p),
        "applicant": to_applicant(p),
        "recommend_request": to_recommend_request(p),
    }
