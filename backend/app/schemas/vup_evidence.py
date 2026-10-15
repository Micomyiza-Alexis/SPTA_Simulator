from pydantic import BaseModel


class VUPCategoryCount(BaseModel):
    category: str
    count: int
    percent: float | None


class VUPMetadata(BaseModel):
    title: str
    source: str
    master_households: int
    component_files: int
    weighting: str
    generated_at_utc: str
    privacy_note: str


class VUPComponent(BaseModel):
    key: str
    label: str
    unique_households: int
    duplicate_rows_removed: int
    poverty_composition: list[VUPCategoryCount]


class VUPOverlapBand(BaseModel):
    components_per_household: int
    households: int


class VUPOverlap(BaseModel):
    households_in_any_component: int
    households_in_no_component: int
    households_in_multiple_components: int
    distribution_by_component_count: list[VUPOverlapBand]


class VUPValidation(BaseModel):
    master_ids_unique: bool
    all_component_ids_matched_to_master: bool
    component_ids_deduplicated_for_overlap: bool
    component_duplicate_rows: dict[str, int]


class VUPEvidenceResponse(BaseModel):
    metadata: VUPMetadata
    overall_poverty_composition: list[VUPCategoryCount]
    programme_components: list[VUPComponent]
    overlap: VUPOverlap
    validation: VUPValidation
