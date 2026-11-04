export interface MentalHealthCenter {
  name: string;
  nameSi: string;
  type: "Government Hospital" | "Befriending Center" | "Community Center";
  address: string;
  phone: string;
  hours: string;
  notes: string;
  is24x7?: boolean;
}

export interface DistrictData {
  district: string;
  districtSi: string;
  province: string;
  centers: MentalHealthCenter[];
}

export const SRI_LANKA_DISTRICTS: DistrictData[] = [
  {
    district: "Colombo",
    districtSi: "කොළඹ",
    province: "Western",
    centers: [
      {
        name: "National Institute of Mental Health (NIMH), Angoda",
        nameSi: "ජාතික මානසික සෞඛ්‍ය විද්‍යායතනය (අංගොඩ)",
        type: "Government Hospital",
        address: "Mulleriyawa New Town, Angoda",
        phone: "1926 (24/7 Toll-Free) / 011 257 8234",
        hours: "24/7 Emergency & Inward Care; OPD Mon-Sat 8:00 AM - 12:00 PM",
        notes: "The apex government specialized psychiatric institution in Sri Lanka. Provides 100% free care.",
        is24x7: true,
      },
      {
        name: "National Hospital of Sri Lanka (NHSL Colombo) - Psychiatry OPD",
        nameSi: "කොළඹ ජාතික රෝහල - මනෝ වෛද්‍ය සායනය",
        type: "Government Hospital",
        address: "Regent Street, Colombo 08",
        phone: "011 269 1111",
        hours: "Mon - Fri: 8:00 AM - 1:00 PM",
        notes: "Free government specialist psychiatric and counseling OPD clinic.",
      },
      {
        name: "Shanthi Maargam - Youth Safe Space",
        nameSi: "ශාන්ති මාර්ගම් (තරුණ මනෝ සුවතා මධ්‍යස්ථානය)",
        type: "Community Center",
        address: "Wellawatte, Colombo 06",
        phone: "071 763 9898",
        hours: "Mon - Sat: 9:00 AM - 5:00 PM",
        notes: "Free adolescent and youth-focused emotional support and psychological counseling.",
      },
      {
        name: "CCCline (Courage Compassion Commitment)",
        nameSi: "CCC ලයින් දුරකථන උපකාරක සේවය",
        type: "Befriending Center",
        address: "Colombo",
        phone: "1333 (24/7 Toll-Free)",
        hours: "24/7 Nationwide Toll-Free Phone Befriending",
        notes: "Free emotional support in Sinhala, Tamil, and English.",
        is24x7: true,
      },
    ],
  },
  {
    district: "Gampaha",
    districtSi: "ගම්පහ",
    province: "Western",
    centers: [
      {
        name: "District General Hospital Gampaha - Psychiatry Clinic",
        nameSi: "ගම්පහ දිස්ත්‍රික් මහ රෝහල - මනෝ වෛද්‍ය සායනය",
        type: "Government Hospital",
        address: "Hospital Road, Gampaha",
        phone: "033 222 2261",
        hours: "Mon - Fri: 8:00 AM - 12:00 PM",
        notes: "Free government consultant psychiatrist consultations and emotional support.",
      },
      {
        name: "Colombo North Teaching Hospital (Ragama) - Psychiatry Unit",
        nameSi: "රාගම ශික්ෂණ රෝහල - මනෝ වෛද්‍ය ඒකකය",
        type: "Government Hospital",
        address: "Ragama",
        phone: "011 295 9261",
        hours: "Daily Emergency OPD; Clinics Mon-Fri mornings",
        notes: "Full inpatient and outpatient mental health services by university specialists.",
      },
      {
        name: "District General Hospital Negombo",
        nameSi: "මීගමුව දිස්ත්‍රික් මහ රෝහල",
        type: "Government Hospital",
        address: "Colombo Road, Negombo",
        phone: "031 222 2261",
        hours: "Mon - Fri: 8:00 AM - 12:00 PM",
        notes: "Free government psychiatric outpatient clinic and crisis assistance.",
      },
    ],
  },
  {
    district: "Kalutara",
    districtSi: "කළුතර",
    province: "Western",
    centers: [
      {
        name: "District General Hospital Kalutara (Nagoda) - Psychiatry Unit",
        nameSi: "නාගොඩ මහ රෝහල - මනෝ වෛද්‍ය ඒකකය",
        type: "Government Hospital",
        address: "Nagoda, Kalutara",
        phone: "034 222 2261",
        hours: "Mon - Fri: 8:00 AM - 1:00 PM",
        notes: "Free psychiatric consultation and clinical psychology support.",
      },
      {
        name: "Base Hospital Panadura",
        nameSi: "පානදුර මූලික රෝහල",
        type: "Government Hospital",
        address: "Panadura",
        phone: "038 223 2261",
        hours: "Regular OPD psychiatric clinic days",
        notes: "Outpatient psychiatric support and medical care.",
      },
    ],
  },
  {
    district: "Kandy",
    districtSi: "මහනුවර",
    province: "Central",
    centers: [
      {
        name: "National Hospital Kandy (General Hospital Kandy) - Psychiatry Unit",
        nameSi: "මහනුවර ජාතික රෝහල - මනෝ වෛද්‍ය ඒකකය",
        type: "Government Hospital",
        address: "Hospital Square, Kandy",
        phone: "081 222 2261",
        hours: "24/7 Emergency; OPD Clinics Mon-Fri 8:00 AM - 1:00 PM",
        notes: "Comprehensive specialized psychiatric services for the Central Province.",
        is24x7: true,
      },
      {
        name: "Teaching Hospital Peradeniya - Department of Psychiatry",
        nameSi: "පේරාදෙණිය ශික්ෂණ රෝහල - මනෝ වෛද්‍ය අංශය",
        type: "Government Hospital",
        address: "Peradeniya",
        phone: "081 238 8001",
        hours: "Mon - Fri: 8:00 AM - 1:00 PM",
        notes: "University psychiatry unit providing comprehensive adolescent and adult care.",
      },
    ],
  },
  {
    district: "Galle",
    districtSi: "ගාල්ල",
    province: "Southern",
    centers: [
      {
        name: "Teaching Hospital Karapitiya - Psychiatry & Mental Health Unit",
        nameSi: "කරාපිටිය ශික්ෂණ රෝහල - මනෝ වෛද්‍ය ඒකකය",
        type: "Government Hospital",
        address: "Karapitiya, Galle",
        phone: "091 223 2250",
        hours: "24/7 Emergency; OPD Clinic Mon-Fri 8:00 AM - 1:00 PM",
        notes: "Southern Province tertiary mental health care center with full specialist team.",
        is24x7: true,
      },
    ],
  },
  {
    district: "Matara",
    districtSi: "මාතර",
    province: "Southern",
    centers: [
      {
        name: "District General Hospital Matara - Psychiatry Clinic",
        nameSi: "මාතර දිස්ත්‍රික් මහ රෝහල - මනෝ වෛද්‍ය සායනය",
        type: "Government Hospital",
        address: "Hospital Road, Matara",
        phone: "041 222 2261",
        hours: "Mon - Fri: 8:00 AM - 1:00 PM",
        notes: "Free government specialist psychiatric clinic and counseling services.",
      },
    ],
  },
  {
    district: "Kurunegala",
    districtSi: "කුරුණෑගල",
    province: "North Western",
    centers: [
      {
        name: "Teaching Hospital Kurunegala - Department of Psychiatry",
        nameSi: "කුරුණෑගල ශික්ෂණ රෝහල - මනෝ වෛද්‍ය අංශය",
        type: "Government Hospital",
        address: "Hospital Road, Kurunegala",
        phone: "037 222 2261",
        hours: "Daily Emergency; OPD Clinic Mon-Fri 8:00 AM - 12:00 PM",
        notes: "Apex hospital for the North Western Province with in-patient and out-patient services.",
        is24x7: true,
      },
    ],
  },
  {
    district: "Anuradhapura",
    districtSi: "අනුරාධපුරය",
    province: "North Central",
    centers: [
      {
        name: "Teaching Hospital Anuradhapura - Psychiatry Unit",
        nameSi: "අනුරාධපුර ශික්ෂණ රෝහල - මනෝ වෛද්‍ය ඒකකය",
        type: "Government Hospital",
        address: "Hospital Road, Anuradhapura",
        phone: "025 222 2261",
        hours: "24/7 Emergency; OPD Clinics Mon-Fri 8:00 AM - 1:00 PM",
        notes: "Free psychiatric care, clinical counseling, and community mental health outreach.",
        is24x7: true,
      },
    ],
  },
  {
    district: "Jaffna",
    districtSi: "යාපනය",
    province: "Northern",
    centers: [
      {
        name: "Teaching Hospital Jaffna - Department of Psychiatry",
        nameSi: "යාපනය ශික්ෂණ රෝහල - මනෝ වෛද්‍ය අංශය",
        type: "Government Hospital",
        address: "Hospital Road, Jaffna",
        phone: "021 222 2261",
        hours: "24/7 Inward & Emergency; OPD Clinics Mon-Fri 8:00 AM - 1:00 PM",
        notes: "Northern Province apex psychiatric unit with Tamil and English speaking specialists.",
        is24x7: true,
      },
      {
        name: "Shanthiham Association for Health & Counseling",
        nameSi: "ශාන්තිහම් සෞඛ්‍ය හා උපදේශන සේවය",
        type: "Community Center",
        address: "Kandy Road, Jaffna",
        phone: "021 222 6262",
        hours: "Mon - Fri: 8:30 AM - 4:30 PM",
        notes: "Community psychological support, trauma recovery, and befriending in Tamil.",
      },
    ],
  },
  {
    district: "Badulla",
    districtSi: "බදුල්ල",
    province: "Uva",
    centers: [
      {
        name: "Provincial General Hospital Badulla - Psychiatry Clinic",
        nameSi: "බදුල්ල පළාත් මහ රෝහල - මනෝ වෛද්‍ය සායනය",
        type: "Government Hospital",
        address: "Hospital Road, Badulla",
        phone: "055 222 2261",
        hours: "Mon - Fri: 8:00 AM - 1:00 PM",
        notes: "Free psychiatric assessment and mental wellness services for Uva province.",
      },
    ],
  },
  {
    district: "Ratnapura",
    districtSi: "රත්නපුර",
    province: "Sabaragamuwa",
    centers: [
      {
        name: "Teaching Hospital Ratnapura - Psychiatry Unit",
        nameSi: "රත්නපුර ශික්ෂණ රෝහල - මනෝ වෛද්‍ය ඒකකය",
        type: "Government Hospital",
        address: "Hospital Road, Ratnapura",
        phone: "045 222 2261",
        hours: "Mon - Fri: 8:00 AM - 1:00 PM",
        notes: "Comprehensive mental healthcare and psychological counseling.",
      },
    ],
  },
  {
    district: "Batticaloa",
    districtSi: "මඩකලපුව",
    province: "Eastern",
    centers: [
      {
        name: "Teaching Hospital Batticaloa - Department of Psychiatry",
        nameSi: "මඩකලපුව ශික්ෂණ රෝහල - මනෝ වෛද්‍ය ඒකකය",
        type: "Government Hospital",
        address: "Hospital Road, Batticaloa",
        phone: "065 222 2261",
        hours: "24/7 Emergency; OPD Clinics Mon-Fri mornings",
        notes: "Free specialized psychiatric care and counseling in Tamil, Sinhala, and English.",
        is24x7: true,
      },
    ],
  },
];

