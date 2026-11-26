<?php

namespace App\Constants;

class EmergencyComplaints
{
    public const CATEGORIES = [
        'Medical Emergency' => [
            'Medical Emergency',
            'Cardiac Emergency',
            'Respiratory Emergency',
            'Diabetic Emergency',
            'Psychiatric Emergency',
            'Motor Vehicular Accidents',
            'Motor Vehicular Accidents (Pedestrian)',
            'Mass Casualty Incident (Trauma)',
            'Mass Casualty Incident (Medical, Infectious)',
            'Industrial Accident',
            'Transport Home to Hospital',
            'Transport for Check Up',
            'Transport for Referral',
            'Transport for Hospital Admission',
            'Transport (Cadaver)',
            'Covid-19 Transport',
            'Bleeding',
            'Hemorrhage/Laceration/Abrasion',
            'Trauma',
            'Fall Victim',
            'Fracture/Dislocation',
            'Abdominal Pain',
            'Back Pain',
            'Headache',
            'Eye Problem',
            'Breathing Problems/Difficulty of Breathing',
            'Burns',
            'Electrical Shock',
            'Allergic Reaction',
            'Overdose',
            'Flu-like Symptoms',
            'Unconscious',
            'Seizures',
            'Pregnancy/Childbirth',
            'Wound Dressing/First Aid',
            'Dead',
            'Nausea and Vomiting',
            'Fainting',
            'Suicide',
            'CVA (Stroke)',
            'Animal Bite',
            'Stab Wound',
            'Hypertensive Emergency',
            'Psychosomatic Disorder',
            'Post Operative Case',
            'Loss of Bowel Movement/Mild Dehydration',
            'Chest Pain',
            'Body Weakness',
            'Attempted Suicide',
        ],
        'Fire Emergency' => [
            'Fire Incidents',
            'Burns',
            'Smoke Inhalation',
            'Hazardous Materials',
            'Hazardous Condition',
        ],
        'Severe Weather / Flood' => [
            'Severe Weather',
            'Flash Flood Emergency',
            'Storm Surge',
            'Typhoon Disaster',
            'Landslide Incident',
            'Evacuation Center Management',
        ],
        'Crime & Security' => [
            'Bomb Threat',
            'Hostage Situation',
            'Terrorism',
            'Assault',
            'Civil Disturbance',
            'Armed Robbery',
            'Theft',
        ],
        'Search & Rescue' => [
            'Search and Rescue/Retrieval',
            'Water Rescue/Drowning Incident',
            'Mountain Search and Rescue',
            'Collapsed Structure Rescue',
            'Trapped Victims Extraction',
            'River Current Sweep Retrieval',
            'Missing Persons',
        ],
    ];

    public const ALL = [
        // Medical Emergency
        'Medical Emergency',
        'Cardiac Emergency',
        'Respiratory Emergency',
        'Diabetic Emergency',
        'Psychiatric Emergency',
        'Motor Vehicular Accidents',
        'Motor Vehicular Accidents (Pedestrian)',
        'Mass Casualty Incident (Trauma)',
        'Mass Casualty Incident (Medical, Infectious)',
        'Industrial Accident',
        'Transport Home to Hospital',
        'Transport for Check Up',
        'Transport for Referral',
        'Transport for Hospital Admission',
        'Transport (Cadaver)',
        'Covid-19 Transport',
        'Bleeding',
        'Hemorrhage/Laceration/Abrasion',
        'Trauma',
        'Fall Victim',
        'Fracture/Dislocation',
        'Abdominal Pain',
        'Back Pain',
        'Headache',
        'Eye Problem',
        'Breathing Problems/Difficulty of Breathing',
        'Burns',
        'Electrical Shock',
        'Allergic Reaction',
        'Overdose',
        'Flu-like Symptoms',
        'Unconscious',
        'Seizures',
        'Pregnancy/Childbirth',
        'Wound Dressing/First Aid',
        'Dead',
        'Nausea and Vomiting',
        'Fainting',
        'Suicide',
        'CVA (Stroke)',
        'Animal Bite',
        'Stab Wound',
        'Hypertensive Emergency',
        'Psychosomatic Disorder',
        'Post Operative Case',
        'Loss of Bowel Movement/Mild Dehydration',
        'Chest Pain',
        'Body Weakness',
        'Attempted Suicide',

        // Fire Emergency
        'Fire Incidents',
        'Burns',
        'Smoke Inhalation',
        'Hazardous Materials',
        'Hazardous Condition',

        // Severe Weather / Flood
        'Severe Weather',
        'Search and Rescue/Retrieval',
        'Water Rescue/Drowning Incident',
        'Evacuation Center Management',

        // Crime & Security
        'Bomb Threat',
        'Hostage Situation',
        'Terrorism',
        'Assault',
        'Missing Persons',

        // Other / Non-Emergency
        'Public Service',
        'Training',
        'Stand-By Unit',
        'Calls (Emergency, Assistance and Inquiry)',
        'Waiver',
    ];

    public static function getAllCategories(): array
    {
        return array_keys(self::CATEGORIES);
    }

    public static function getByCategory(string $category): array
    {
        return self::CATEGORIES[$category] ?? [];
    }

    public static function getCategoryForComplaint(?string $complaint, ?string $defaultCategory = null): string
    {
        if (empty($complaint)) {
            return $defaultCategory ?: 'Medical Emergency';
        }

        $normalized = strtolower(trim($complaint));

        // If defaultCategory is provided and complaint is listed in that category, preserve defaultCategory
        if (!empty($defaultCategory)) {
            $normDefault = strtolower(trim($defaultCategory));
            foreach (self::CATEGORIES as $category => $complaints) {
                if (strtolower($category) === $normDefault) {
                    foreach ($complaints as $item) {
                        if (strtolower($item) === $normalized) {
                            return $category;
                        }
                    }
                }
            }
        }

        // 1. Direct match with constant list
        foreach (self::CATEGORIES as $category => $complaints) {
            foreach ($complaints as $item) {
                if (strtolower($item) === $normalized) {
                    return $category;
                }
            }
        }

        // 2. Direct match with database emergency_complaints table (for dynamic/custom complaints)
        try {
            $dbComplaint = \App\Models\EmergencyComplaint::whereRaw('LOWER(complaint_name) = ?', [$normalized])->first();
            if ($dbComplaint && !empty($dbComplaint->category)) {
                return $dbComplaint->category;
            }
        } catch (\Throwable $e) {
            // Safe fallback
        }

        // 3. Clinical heuristics based on keywords
        if (str_contains($normalized, 'rescue') || str_contains($normalized, 'drown') || str_contains($normalized, 'sweep') || str_contains($normalized, 'search') || str_contains($normalized, 'trapped') || str_contains($normalized, 'mountain')) {
            return 'Search & Rescue';
        }
        if (str_contains($normalized, 'flood') || str_contains($normalized, 'weather') || str_contains($normalized, 'typhoon') || str_contains($normalized, 'surge') || str_contains($normalized, 'storm') || str_contains($normalized, 'landslide')) {
            return 'Severe Weather / Flood';
        }
        if (str_contains($normalized, 'fire') || str_contains($normalized, 'burn') || str_contains($normalized, 'smoke') || str_contains($normalized, 'conflagration')) {
            return 'Fire Emergency';
        }
        if (str_contains($normalized, 'assault') || str_contains($normalized, 'threat') || str_contains($normalized, 'crime') || str_contains($normalized, 'hostage') || str_contains($normalized, 'terror') || str_contains($normalized, 'stab') || str_contains($normalized, 'robbery') || str_contains($normalized, 'theft')) {
            return 'Crime & Security';
        }
        if (str_contains($normalized, 'medic') || str_contains($normalized, 'accident') || str_contains($normalized, 'trauma') || str_contains($normalized, 'pain') || str_contains($normalized, 'patient') || str_contains($normalized, 'cardiac') || str_contains($normalized, 'stroke') || str_contains($normalized, 'wound')) {
            return 'Medical Emergency';
        }

        return 'Medical Emergency';
    }
}
