<?php

return [
    // Percentages used to split actual_lkg during raw_data -> productions processing.
    'pdpa_lkg_rate' => env('TRANSFORM_PDPA_LKG_RATE', 0.02),
    'association_dues_lkg_rate' => env('TRANSFORM_ASSOC_DUES_LKG_RATE', 0.01),
];
