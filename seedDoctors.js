const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Doctor = require('./models/Doctor');

const doctors = [
  {
    name: 'Dr. Suraj Sharma',
    specialization: 'Cardiology',
    specialty: 'Interventional Cardiology',
    experience: 15,
    location: 'New York',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
    email: 'suraj7340@gmail.com',
    phone: '7340568693'
  },
  {
    name: 'Dr. Sarah Johnson',
    specialization: 'Cardiology',
    specialty: 'Pediatric Cardiology',
    experience: 12,
    location: 'Los Angeles',
    image: 'https://randomuser.me/api/portraits/women/2.jpg',
    email: 'sarah.johnson@hospital.com',
    phone: '+1-555-0102'
  },
  {
    name: 'Dr. Michael Brown',
    specialization: 'Dermatology',
    specialty: 'Cosmetic Dermatology',
    experience: 10,
    location: 'Chicago',
    image: 'https://randomuser.me/api/portraits/men/3.jpg',
    email: 'michael.brown@hospital.com',
    phone: '+1-555-0103'
  },
  {
    name: 'Dr. Emily Davis',
    specialization: 'Dermatology',
    specialty: 'Medical Dermatology',
    experience: 8,
    location: 'Houston',
    image: 'https://randomuser.me/api/portraits/women/4.jpg',
    email: 'emily.davis@hospital.com',
    phone: '+1-555-0104'
  },
  {
    name: 'Dr. Robert Wilson',
    specialization: 'Neurology',
    specialty: 'Neurological Surgery',
    experience: 18,
    location: 'Phoenix',
    image: 'https://randomuser.me/api/portraits/men/5.jpg',
    email: 'robert.wilson@hospital.com',
    phone: '+1-555-0105'
  },
  {
    name: 'Dr. Lisa Garcia',
    specialization: 'Neurology',
    specialty: 'Clinical Neurophysiology',
    experience: 14,
    location: 'Philadelphia',
    image: 'https://randomuser.me/api/portraits/women/6.jpg',
    email: 'lisa.garcia@hospital.com',
    phone: '+1-555-0106'
  },
  {
    name: 'Dr. David Martinez',
    specialization: 'Pediatrics',
    specialty: 'Neonatal-Perinatal Medicine',
    experience: 11,
    location: 'San Antonio',
    image: 'https://randomuser.me/api/portraits/men/7.jpg',
    email: 'david.martinez@hospital.com',
    phone: '+1-555-0107'
  },
  {
    name: 'Dr. Jennifer Anderson',
    specialization: 'Pediatrics',
    specialty: 'Pediatric Endocrinology',
    experience: 9,
    location: 'San Diego',
    image: 'https://randomuser.me/api/portraits/women/8.jpg',
    email: 'jennifer.anderson@hospital.com',
    phone: '+1-555-0108'
  },
  {
    name: 'Dr. Christopher Taylor',
    specialization: 'General Medicine',
    specialty: 'Internal Medicine',
    experience: 16,
    location: 'Dallas',
    image: 'https://randomuser.me/api/portraits/men/9.jpg',
    email: 'christopher.taylor@hospital.com',
    phone: '+1-555-0109'
  },
  {
    name: 'Dr. Amanda Thomas',
    specialization: 'General Medicine',
    specialty: 'Family Medicine',
    experience: 13,
    location: 'San Jose',
    image: 'https://randomuser.me/api/portraits/women/10.jpg',
    email: 'amanda.thomas@hospital.com',
    phone: '+1-555-0110'
  },
  {
    name: 'Dr. Kevin Lee',
    specialization: 'Orthopedics',
    specialty: 'Sports Medicine',
    experience: 17,
    location: 'Austin',
    image: 'https://randomuser.me/api/portraits/men/11.jpg',
    email: 'kevin.lee@hospital.com',
    phone: '+1-555-0111'
  },
  {
    name: 'Dr. Rachel White',
    specialization: 'Gynecology',
    specialty: 'Obstetrics and Gynecology',
    experience: 14,
    location: 'Seattle',
    image: 'https://randomuser.me/api/portraits/women/12.jpg',
    email: 'rachel.white@hospital.com',
    phone: '+1-555-0112'
  },
  {
    name: 'Dr. Brian Harris',
    specialization: 'Ophthalmology',
    specialty: 'Retina Specialist',
    experience: 12,
    location: 'Denver',
    image: 'https://randomuser.me/api/portraits/men/13.jpg',
    email: 'brian.harris@hospital.com',
    phone: '+1-555-0113'
  },
  {
    name: 'Dr. Sophia Clark',
    specialization: 'ENT',
    specialty: 'Otolaryngology',
    experience: 10,
    location: 'Boston',
    image: 'https://randomuser.me/api/portraits/women/14.jpg',
    email: 'sophia.clark@hospital.com',
    phone: '+1-555-0114'
  },
  {
    name: 'Dr. Daniel Lewis',
    specialization: 'Psychiatry',
    specialty: 'Child Psychiatry',
    experience: 15,
    location: 'Miami',
    image: 'https://randomuser.me/api/portraits/men/15.jpg',
    email: 'daniel.lewis@hospital.com',
    phone: '+1-555-0115'
  },
  {
    name: 'Dr. Olivia Martinez',
    specialization: 'Cardiology',
    specialty: 'Electrophysiology',
    experience: 13,
    location: 'Atlanta',
    image: 'https://randomuser.me/api/portraits/women/16.jpg',
    email: 'olivia.martinez@hospital.com',
    phone: '+1-555-0116'
  },
  {
    name: 'Dr. Ethan Wilson',
    specialization: 'Dermatology',
    specialty: 'Dermatopathology',
    experience: 11,
    location: 'Portland',
    image: 'https://randomuser.me/api/portraits/men/17.jpg',
    email: 'ethan.wilson@hospital.com',
    phone: '+1-555-0117'
  },
  {
    name: 'Dr. Sophia Rodriguez',
    specialization: 'Neurology',
    specialty: 'Neurocritical Care',
    experience: 16,
    location: 'Nashville',
    image: 'https://randomuser.me/api/portraits/women/18.jpg',
    email: 'sophia.rodriguez@hospital.com',
    phone: '+1-555-0118'
  },
  {
    name: 'Dr. Liam Thompson',
    specialization: 'Pediatrics',
    specialty: 'Pediatric Cardiology',
    experience: 10,
    location: 'Salt Lake City',
    image: 'https://randomuser.me/api/portraits/men/19.jpg',
    email: 'liam.thompson@hospital.com',
    phone: '+1-555-0119'
  },
  {
    name: 'Dr. Ava Garcia',
    specialization: 'General Medicine',
    specialty: 'Geriatric Medicine',
    experience: 14,
    location: 'Raleigh',
    image: 'https://randomuser.me/api/portraits/women/20.jpg',
    email: 'ava.garcia@hospital.com',
    phone: '+1-555-0120'
  },
  {
    name: 'Dr. Noah Hernandez',
    specialization: 'Orthopedics',
    specialty: 'Joint Replacement',
    experience: 19,
    location: 'Omaha',
    image: 'https://randomuser.me/api/portraits/men/21.jpg',
    email: 'noah.hernandez@hospital.com',
    phone: '+1-555-0121'
  },
  {
    name: 'Dr. Isabella Lopez',
    specialization: 'Gynecology',
    specialty: 'Reproductive Endocrinology',
    experience: 12,
    location: 'Colorado Springs',
    image: 'https://randomuser.me/api/portraits/women/22.jpg',
    email: 'isabella.lopez@hospital.com',
    phone: '+1-555-0122'
  },
  {
    name: 'Dr. Mason Gonzalez',
    specialization: 'Ophthalmology',
    specialty: 'Glaucoma Specialist',
    experience: 15,
    location: 'Virginia Beach',
    image: 'https://randomuser.me/api/portraits/men/23.jpg',
    email: 'mason.gonzalez@hospital.com',
    phone: '+1-555-0123'
  },
  {
    name: 'Dr. Charlotte Perez',
    specialization: 'ENT',
    specialty: 'Head and Neck Surgery',
    experience: 13,
    location: 'Oakland',
    image: 'https://randomuser.me/api/portraits/women/24.jpg',
    email: 'charlotte.perez@hospital.com',
    phone: '+1-555-0124'
  },
  {
    name: 'Dr. Elijah Torres',
    specialization: 'Psychiatry',
    specialty: 'Forensic Psychiatry',
    experience: 17,
    location: 'Minneapolis',
    image: 'https://randomuser.me/api/portraits/men/25.jpg',
    email: 'elijah.torres@hospital.com',
    phone: '+1-555-0125'
  },
  {
    name: 'Dr. Harper Lee',
    specialization: 'Cardiology',
    specialty: 'Heart Failure Specialist',
    experience: 20,
    location: 'Tucson',
    image: 'https://randomuser.me/api/portraits/women/26.jpg',
    email: 'harper.lee@hospital.com',
    phone: '+1-555-0126'
  },
  {
    name: 'Dr. Lucas Walker',
    specialization: 'Dermatology',
    specialty: 'Pediatric Dermatology',
    experience: 9,
    location: 'Fresno',
    image: 'https://randomuser.me/api/portraits/men/27.jpg',
    email: 'lucas.walker@hospital.com',
    phone: '+1-555-0127'
  },
  {
    name: 'Dr. Mia Hall',
    specialization: 'Neurology',
    specialty: 'Movement Disorders',
    experience: 15,
    location: 'Sacramento',
    image: 'https://randomuser.me/api/portraits/women/28.jpg',
    email: 'mia.hall@hospital.com',
    phone: '+1-555-0128'
  },
  {
    name: 'Dr. Jackson Allen',
    specialization: 'Pediatrics',
    specialty: 'Adolescent Medicine',
    experience: 12,
    location: 'Mesa',
    image: 'https://randomuser.me/api/portraits/men/29.jpg',
    email: 'jackson.allen@hospital.com',
    phone: '+1-555-0129'
  },
  {
    name: 'Dr. Evelyn Young',
    specialization: 'General Medicine',
    specialty: 'Sports Medicine',
    experience: 11,
    location: 'Kansas City',
    image: 'https://randomuser.me/api/portraits/women/30.jpg',
    email: 'evelyn.young@hospital.com',
    phone: '+1-555-0130'
  },
  {
    name: 'Dr. Aiden King',
    specialization: 'Orthopedics',
    specialty: 'Spine Surgery',
    experience: 18,
    location: 'Wichita',
    image: 'https://randomuser.me/api/portraits/men/31.jpg',
    email: 'aiden.king@hospital.com',
    phone: '+1-555-0131'
  },
  {
    name: 'Dr. Scarlett Wright',
    specialization: 'Gynecology',
    specialty: 'Gynecologic Oncology',
    experience: 16,
    location: 'Long Beach',
    image: 'https://randomuser.me/api/portraits/women/32.jpg',
    email: 'scarlett.wright@hospital.com',
    phone: '+1-555-0132'
  },
  {
    name: 'Dr. Levi Lopez',
    specialization: 'Ophthalmology',
    specialty: 'Cornea Specialist',
    experience: 14,
    location: 'Raleigh',
    image: 'https://randomuser.me/api/portraits/men/33.jpg',
    email: 'levi.lopez@hospital.com',
    phone: '+1-555-0133'
  },
  {
    name: 'Dr. Zoe Hill',
    specialization: 'ENT',
    specialty: 'Audiology',
    experience: 10,
    location: 'Colorado Springs',
    image: 'https://randomuser.me/api/portraits/women/34.jpg',
    email: 'zoe.hill@hospital.com',
    phone: '+1-555-0134'
  },
  {
    name: 'Dr. Nolan Green',
    specialization: 'Psychiatry',
    specialty: 'Addiction Psychiatry',
    experience: 13,
    location: 'Virginia Beach',
    image: 'https://randomuser.me/api/portraits/men/35.jpg',
    email: 'nolan.green@hospital.com',
    phone: '+1-555-0135'
  },
  {
    name: 'Dr. Stella Adams',
    specialization: 'Cardiology',
    specialty: 'Preventive Cardiology',
    experience: 17,
    location: 'Oakland',
    image: 'https://randomuser.me/api/portraits/women/36.jpg',
    email: 'stella.adams@hospital.com',
    phone: '+1-555-0136'
  },
  {
    name: 'Dr. Grayson Baker',
    specialization: 'Dermatology',
    specialty: 'Mohs Surgery',
    experience: 12,
    location: 'Minneapolis',
    image: 'https://randomuser.me/api/portraits/men/37.jpg',
    email: 'grayson.baker@hospital.com',
    phone: '+1-555-0137'
  },
  {
    name: 'Dr. Lily Gonzalez',
    specialization: 'Neurology',
    specialty: 'Epilepsy',
    experience: 14,
    location: 'Tucson',
    image: 'https://randomuser.me/api/portraits/women/38.jpg',
    email: 'lily.gonzalez@hospital.com',
    phone: '+1-555-0138'
  },
  {
    name: 'Dr. Mateo Nelson',
    specialization: 'Pediatrics',
    specialty: 'Developmental Pediatrics',
    experience: 11,
    location: 'Fresno',
    image: 'https://randomuser.me/api/portraits/men/39.jpg',
    email: 'mateo.nelson@hospital.com',
    phone: '+1-555-0139'
  }
];

const seedDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare');
    await Doctor.deleteMany(); // Clear existing doctors
    await Doctor.insertMany(doctors);
    console.log('Doctors seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
};

seedDoctors();
