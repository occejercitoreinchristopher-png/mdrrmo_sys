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
            'Hazardous Materials',
            'Hazardous Condition',
        ],
        'Severe Weather / Flood' => [
            'Severe Weather',
            'Search and Rescue/Retrieval',
            'Water Rescue/Drowning Incident',
            'Evacuation Center Management',
        ],
        'Crime & Security' => [
            'Bomb Threat',
            'Hostage Situation',
            'Terrorism',
            'Assault',
            'Missing Persons',
        ],
        'Other / Non-Emergency' => [
            'Public Service',
            'Training',
            'Stand-By Unit',
            'Calls (Emergency, Assistance and Inquiry)',
            'Waiver',
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

    public static function getCategoryForComplaint(?string $complaint): string
    {
        if (empty($complaint)) {
            return 'Other / Non-Emergency';
        }

        $normalized = strtolower(trim($complaint));

        foreach (self::CATEGORIES as $category => $complaints) {
            foreach ($complaints as $item) {
                if (strtolower($item) === $normalized) {
                    return $category;
                }
            }
        }

        // Fuzzy fallback based on keywords
        if (str_contains($normalized, 'fire') || str_contains($normalized, 'burn')) {
            return 'Fire Emergency';
        }
        if (str_contains($normalized, 'flood') || str_contains($normalized, 'weather') || str_contains($normalized, 'rescue') || str_contains($normalized, 'drown')) {
            return 'Severe Weather / Flood';
        }
        if (str_contains($normalized, 'assault') || str_contains($normalized, 'threat') || str_contains($normalized, 'crime') || str_contains($normalized, 'hostage')) {
            return 'Crime & Security';
        }
        if (str_contains($normalized, 'medic') || str_contains($normalized, 'accident') || str_contains($normalized, 'trauma') || str_contains($normalized, 'pain')) {
            return 'Medical Emergency';
        }

        return 'Other / Non-Emergency';
    }
}
