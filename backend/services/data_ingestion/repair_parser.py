from typing import Dict, Any, List
from .models import ProvenanceMetadata

class RepairEstimateParser:
    """
    Normalized Repair Estimate Ingestion Model.
    Supports integration with external legitimate real-world pricing data catalogs 
    (e.g., Audatex/Mitchell APIs if later licensed, or open OEM parts data).
    """
    
    def __init__(self, external_pricing_adapter=None):
        self.pricing_adapter = external_pricing_adapter
        
    def parse_estimate(self, raw_estimate: Dict[str, Any], provenance: ProvenanceMetadata) -> Dict[str, Any]:
        """
        Takes a raw garage estimate and normalizes it.
        """
        normalized_parts = []
        total_parts = 0.0
        total_labour = 0.0
        
        for item in raw_estimate.get("line_items", []):
            part_name = item.get("part")
            qty = float(item.get("quantity", 1))
            unit_price = float(item.get("unit_price", 0.0))
            is_oem = item.get("oem", True)
            
            # 1. External Pricing Validation (Adapter Pattern)
            validated_price = unit_price
            price_confidence = 0.0
            
            if self.pricing_adapter:
                catalog_match = self.pricing_adapter.lookup_price(part_name, is_oem)
                if catalog_match:
                    validated_price = catalog_match["price"]
                    price_confidence = 0.95
            
            item_total = qty * validated_price
            
            normalized_parts.append({
                "component": part_name,
                "category": self._categorize_part(part_name),
                "oem": is_oem,
                "quantity": qty,
                "unit_price": validated_price,
                "price_confidence": price_confidence,
                "depreciation_applicable": self._is_depreciable(part_name),
                "total": item_total
            })
            
            total_parts += item_total
            total_labour += float(item.get("labour_cost", 0.0))
            
        return {
            "status": "NORMALIZED",
            "provenance": provenance.dict(),
            "line_items": normalized_parts,
            "financial_summary": {
                "total_parts": total_parts,
                "total_labour": total_labour,
                "consumables": raw_estimate.get("consumables", 0.0),
                "gst": raw_estimate.get("gst", total_parts * 0.18),
                "grand_total": total_parts + total_labour + raw_estimate.get("consumables", 0.0) + raw_estimate.get("gst", total_parts * 0.18)
            }
        }
        
    def _categorize_part(self, part_name: str) -> str:
        name = part_name.lower()
        if "bumper" in name or "plastic" in name: return "PLASTIC"
        if "glass" in name or "windshield" in name: return "GLASS"
        if "battery" in name or "tyre" in name or "tube" in name: return "RUBBER_NYLON_BATTERY"
        return "METAL"

    def _is_depreciable(self, part_name: str) -> bool:
        return self._categorize_part(part_name) != "GLASS"
