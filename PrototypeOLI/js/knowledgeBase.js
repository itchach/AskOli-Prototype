/* ============================================
   AskOli — Knowledge Base Engine
   CRUD + Seed Data + Search
   ============================================ */

const KnowledgeBase = (() => {
  const STORAGE_KEY = 'askoli_kb';
  const CATEGORIES_KEY = 'askoli_categories';

  // ── Default Categories ──
  const DEFAULT_CATEGORIES = [
    'Documents',
    'Procedures',
    'Requirements',
    'Facilities',
    'Offices',
    'Policies',
    'Services',
    'Academic Information',
    'Student Information',
    'FAQs',
    'Other Olivarez College Information'
  ];

  // ── Seed Data ──
  const SEED_DATA = [
    {
      id: _uid(),
      title: 'How to Request a Transcript of Records (TOR)',
      category: 'Documents',
      content: `To request a Transcript of Records (TOR) from Olivarez College, follow these steps:\n\n1. Go to the Registrar's Office located at the Ground Floor of the Main Building.\n2. Fill out the Document Request Form.\n3. Pay the processing fee at the Cashier's Office.\n4. Submit the form along with the official receipt to the Registrar's Office.\n5. Wait for the processing period (usually 5–7 working days).\n6. Claim your TOR on the scheduled release date.\n\nRequirements:\n• Valid school ID or any government-issued ID\n• Official Receipt of payment\n• Clearance (for graduating students)\n\nProcessing Fee: ₱150.00 per copy`,
      source: 'Registrar\'s Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-15T08:00:00Z',
      lastUpdated: '2026-06-10T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'How to Request a Certificate of Good Moral Character',
      category: 'Documents',
      content: `To request a Certificate of Good Moral Character:\n\n1. Visit the Guidance Office located at the 2nd Floor of the Main Building.\n2. Fill out the Good Moral Certificate Request Form.\n3. Pay the processing fee at the Cashier's Office.\n4. Return the form with official receipt to the Guidance Office.\n5. Processing takes 3–5 working days.\n6. Claim on the scheduled release date.\n\nRequirements:\n• Valid school ID\n• 1x1 or 2x2 ID photo\n• Official Receipt\n\nProcessing Fee: ₱100.00`,
      source: 'Guidance Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-15T08:00:00Z',
      lastUpdated: '2026-06-10T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'How to Request a Diploma',
      category: 'Documents',
      content: `To request a copy of your Diploma:\n\n1. Proceed to the Registrar's Office.\n2. Fill out the Diploma Request Form.\n3. Pay the fee at the Cashier's Office.\n4. Submit the form and receipt to the Registrar.\n5. Processing takes 10–15 working days.\n\nRequirements:\n• Accomplished Clearance Form\n• Valid ID\n• Official Receipt\n• Authorization letter (if claimed by a representative)\n\nNote: Diploma is only available for graduates who have completed all academic and financial requirements.`,
      source: 'Registrar\'s Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-20T08:00:00Z',
      lastUpdated: '2026-05-15T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Enrollment Procedure for New Students',
      category: 'Procedures',
      content: `Enrollment procedure for new students at Olivarez College:\n\n1. Secure and fill out an Application Form from the Admissions Office.\n2. Submit the accomplished form together with the required documents.\n3. Take the entrance examination (schedule will be given upon submission).\n4. Attend the interview at the Guidance Office.\n5. Wait for the results and acceptance notification.\n6. Once accepted, proceed to the Cashier's Office for payment of fees.\n7. Proceed to the Registrar's Office for official enrollment.\n8. Get your class schedule and student ID.\n\nThe Admissions Office is located at the Ground Floor of the Main Building.`,
      source: 'Admissions Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-10T08:00:00Z',
      lastUpdated: '2026-07-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Enrollment Procedure for Returning Students',
      category: 'Procedures',
      content: `Enrollment procedure for returning/continuing students:\n\n1. Secure your Clearance from the previous semester.\n2. Check your academic status at the Registrar's Office.\n3. Consult with your Department Head or Academic Adviser for subject pre-registration.\n4. Proceed to the Cashier's Office for assessment and payment.\n5. Confirm your enrollment at the Registrar's Office.\n6. Get your updated class schedule.\n\nEnrollment period is announced every semester through official school channels.`,
      source: 'Registrar\'s Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-10T08:00:00Z',
      lastUpdated: '2026-07-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Enrollment Requirements for New Students',
      category: 'Requirements',
      content: `Requirements for new student enrollment at Olivarez College:\n\n• Accomplished Application Form\n• Report Card (Form 138) or SF9\n• Certificate of Good Moral Character from previous school\n• PSA Birth Certificate (original and photocopy)\n• 2x2 ID photos (4 pieces)\n• Transfer Credential / Honorable Dismissal (for transferees)\n• Transcript of Records (for college transferees)\n\nAll documents must be submitted in a long brown envelope.\n\nNote: Additional requirements may apply depending on the program or year level.`,
      source: 'Admissions Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-10T08:00:00Z',
      lastUpdated: '2026-07-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Scholarship Requirements',
      category: 'Requirements',
      content: `Olivarez College offers academic and financial assistance scholarships.\n\nAcademic Scholarship Requirements:\n• Must maintain a General Weighted Average (GWA) of 90% or above\n• No failing grades\n• Good conduct and no disciplinary record\n• Accomplished Scholarship Application Form\n• Copy of grades from the previous semester\n\nFinancial Assistance Requirements:\n• Certificate of Indigency from Barangay\n• Income Tax Return (ITR) of parents/guardians\n• Accomplished Financial Assistance Form\n• Letter of intent\n\nFor more details, visit the Scholarship Office at the 2nd Floor, Main Building.`,
      source: 'Scholarship Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-02-01T08:00:00Z',
      lastUpdated: '2026-06-15T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Library Facilities',
      category: 'Facilities',
      content: `The Olivarez College Library is located at the 3rd Floor of the Main Building.\n\nFacilities available:\n• Reading Area — spacious area with individual and group study tables\n• Computer Section — with internet-connected computers for research\n• Periodicals Section — newspapers, magazines, and journals\n• Reference Section — encyclopedias, dictionaries, and specialized references\n• Audio-Visual Room — for multimedia presentations and viewing\n\nLibrary Hours:\n• Monday to Friday: 7:00 AM – 6:00 PM\n• Saturday: 8:00 AM – 12:00 PM\n\nStudents must present their valid school ID to enter the library.`,
      source: 'Library — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-15T08:00:00Z',
      lastUpdated: '2026-03-20T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Computer Laboratory',
      category: 'Facilities',
      content: `Olivarez College has two Computer Laboratories:\n\n• Computer Lab 1 — 2nd Floor, IT Building (40 units)\n• Computer Lab 2 — 3rd Floor, IT Building (35 units)\n\nFacilities:\n• Desktop computers with updated software\n• High-speed internet connection\n• Air-conditioned rooms\n• Projector and screen for demonstrations\n\nUsage Guidelines:\n• Students must wear proper uniform\n• No food and drinks inside the lab\n• Use computers for academic purposes only\n• Log in and log out properly\n• Report any technical issues to the lab technician\n\nLab Hours: Monday to Saturday, 7:00 AM – 7:00 PM`,
      source: 'IT Department — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-15T08:00:00Z',
      lastUpdated: '2026-04-10T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Gymnasium',
      category: 'Facilities',
      content: `The Olivarez College Gymnasium is a multi-purpose indoor facility used for:\n\n• Physical Education classes\n• School sports events\n• Intramurals\n• School programs and assemblies\n• Graduation ceremonies\n\nThe gymnasium is located at the rear of the campus, behind the Main Building.\n\nAvailable sports facilities:\n• Basketball court\n• Volleyball court\n• Badminton area\n• Stage for events\n\nStudents may use the gymnasium during PE classes or with permission from the Sports Coordinator.`,
      source: 'Sports Coordinator — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-15T08:00:00Z',
      lastUpdated: '2026-03-10T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Registrar\'s Office',
      category: 'Offices',
      content: `The Registrar's Office handles all student academic records and official documentation.\n\nLocation: Ground Floor, Main Building\n\nServices:\n• Enrollment and registration\n• Issuance of academic documents (TOR, Diploma, Certifications)\n• Student records management\n• Transfer credentials\n• Course evaluation\n• Grade inquiries\n\nOffice Hours:\n• Monday to Friday: 8:00 AM – 5:00 PM\n• Saturday: 8:00 AM – 12:00 PM\n\nContact: registrar@olivarezcollege.edu.ph`,
      source: 'Registrar\'s Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-10T08:00:00Z',
      lastUpdated: '2026-06-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Cashier\'s Office',
      category: 'Offices',
      content: `The Cashier's Office handles all financial transactions for students.\n\nLocation: Ground Floor, Main Building (beside the Registrar's Office)\n\nServices:\n• Tuition fee payments\n• Document processing fee payments\n• Refund processing\n• Financial assessment\n• Issuance of official receipts\n• Balance inquiries\n\nPayment Methods:\n• Cash\n• Bank transfer\n• Online payment (via school portal)\n\nOffice Hours:\n• Monday to Friday: 8:00 AM – 5:00 PM\n• Saturday: 8:00 AM – 12:00 PM`,
      source: 'Cashier\'s Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-10T08:00:00Z',
      lastUpdated: '2026-06-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Guidance and Counseling Office',
      category: 'Offices',
      content: `The Guidance and Counseling Office provides support services for the personal, academic, and career development of students.\n\nLocation: 2nd Floor, Main Building\n\nServices:\n• Individual counseling\n• Group counseling\n• Career guidance and assessment\n• Psychological testing\n• Good Moral Certificate issuance\n• Student referral services\n• Parent-teacher consultations\n\nOffice Hours:\n• Monday to Friday: 8:00 AM – 5:00 PM\n\nAll consultations are confidential. Students may walk in or schedule an appointment.`,
      source: 'Guidance Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-10T08:00:00Z',
      lastUpdated: '2026-05-20T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Student Uniform Policy',
      category: 'Policies',
      content: `Olivarez College Uniform Policy:\n\nAll students are required to wear the prescribed school uniform during class days.\n\n• Regular days: Prescribed school uniform with school ID\n• PE days: Official PE uniform (only during PE schedule)\n• Wash Day (Friday): Casual attire (no sleeveless, shorts above the knee, or slippers)\n\nGuidelines:\n• School ID must be visible at all times inside the campus\n• Uniforms must be clean and properly worn\n• Modifications to the uniform are not allowed\n• Students not in proper uniform may not be allowed entry\n\nViolations are subject to the Student Handbook disciplinary guidelines.`,
      source: 'Student Affairs Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-20T08:00:00Z',
      lastUpdated: '2026-06-05T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Attendance Policy',
      category: 'Policies',
      content: `Olivarez College Attendance Policy:\n\n• Students must attend at least 80% of total class hours to be eligible for final examinations.\n• Three (3) consecutive absences without valid reason will result in a warning notice.\n• Excused absences require a medical certificate or parent/guardian letter submitted within 3 days.\n• Late arrivals beyond 15 minutes count as an absence for that period.\n• Cutting classes is a major offense subject to disciplinary action.\n\nFor prolonged absences due to medical or personal reasons, students must file a Leave of Absence through the Dean's Office.`,
      source: 'Student Handbook — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-20T08:00:00Z',
      lastUpdated: '2026-06-05T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Health Services',
      category: 'Services',
      content: `The Olivarez College Health Services Center (Clinic) provides basic health care to students, faculty, and staff.\n\nLocation: Ground Floor, Student Services Building\n\nServices:\n• First aid treatment\n• Basic medical consultation\n• Blood pressure monitoring\n• Health assessment for enrollment\n• Medical certificate issuance (for minor conditions)\n• Health awareness programs\n\nClinic Hours:\n• Monday to Friday: 7:30 AM – 5:30 PM\n• Saturday: 8:00 AM – 12:00 PM\n\nThe school nurse is available during clinic hours. For emergencies, the clinic coordinates with nearby hospitals.`,
      source: 'Health Services Center — Olivarez College',
      status: 'active',
      dateAdded: '2026-02-01T08:00:00Z',
      lastUpdated: '2026-05-15T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'ID Replacement Procedure',
      category: 'Services',
      content: `If you lost or damaged your school ID, follow these steps for replacement:\n\n1. Report the loss to the Student Affairs Office.\n2. Fill out the ID Replacement Form.\n3. Pay the replacement fee at the Cashier's Office.\n4. Submit the form and receipt to the Student Affairs Office.\n5. Have your photo taken (if needed).\n6. Wait for the processing period (3–5 working days).\n7. Claim your new ID.\n\nReplacement Fee: ₱200.00\n\nNote: A temporary ID may be issued while the new one is being processed.`,
      source: 'Student Affairs Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-02-10T08:00:00Z',
      lastUpdated: '2026-05-10T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Grading System',
      category: 'Academic Information',
      content: `Olivarez College uses the following grading system:\n\n• 1.00 — Excellent (97–100%)\n• 1.25 — Very Good (94–96%)\n• 1.50 — Very Good (91–93%)\n• 1.75 — Good (88–90%)\n• 2.00 — Good (85–87%)\n• 2.25 — Satisfactory (82–84%)\n• 2.50 — Satisfactory (79–81%)\n• 2.75 — Fair (76–78%)\n• 3.00 — Passing (75%)\n• 5.00 — Failed (below 75%)\n• INC — Incomplete\n• DRP — Dropped\n\nGrade Composition (typical):\n• Quizzes — 20%\n• Class Participation — 10%\n• Projects/Assignments — 20%\n• Midterm Exam — 25%\n• Final Exam — 25%\n\nNote: Grade composition may vary per department.`,
      source: 'Academic Affairs — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-15T08:00:00Z',
      lastUpdated: '2026-06-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Academic Calendar (School Year 2026–2027)',
      category: 'Academic Information',
      content: `Olivarez College Academic Calendar for SY 2026–2027:\n\nFirst Semester:\n• Enrollment Period: June 15 – July 5, 2026\n• Start of Classes: August 5, 2026\n• Preliminary Exams: September 8–12, 2026\n• Midterm Exams: October 13–17, 2026\n• Final Exams: December 1–5, 2026\n• Semester Break: December 15, 2026 – January 2, 2027\n\nSecond Semester:\n• Enrollment Period: January 5–16, 2027\n• Start of Classes: January 20, 2027\n• Preliminary Exams: February 17–21, 2027\n• Midterm Exams: March 17–21, 2027\n• Final Exams: May 12–16, 2027\n• End of School Year: May 30, 2027\n\nNote: Dates may be subject to change. Please check official announcements.`,
      source: 'Academic Affairs — Olivarez College',
      status: 'active',
      dateAdded: '2026-03-01T08:00:00Z',
      lastUpdated: '2026-07-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Student Organizations',
      category: 'Student Information',
      content: `Olivarez College recognizes various student organizations:\n\nAcademic Organizations:\n• IT Society — for Information Technology students\n• Education Circle — for Education students\n• Business Management Guild — for Business students\n• Criminology Society — for Criminology students\n\nCo-curricular Organizations:\n• Supreme Student Council (SSC)\n• Campus Ministry\n• Red Cross Youth\n• Peer Facilitators Group\n\nHow to join:\n1. Attend the Organization Fair during enrollment or the first month of classes.\n2. Fill out the membership form of your chosen organization.\n3. Attend the orientation and meetings.\n\nAll organizations are supervised by designated faculty advisers and the Student Affairs Office.`,
      source: 'Student Affairs Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-02-15T08:00:00Z',
      lastUpdated: '2026-06-20T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Student Portal Access',
      category: 'Student Information',
      content: `Olivarez College Student Portal:\n\nThe student portal allows you to:\n• View enrolled subjects\n• Check your grades\n• View your balance and payment history\n• Access class schedules\n• Receive announcements\n\nHow to access:\n1. Go to portal.olivarezcollege.edu.ph\n2. Log in using your Student Number as the username.\n3. Default password: your birthdate in MMDDYYYY format.\n4. Change your password upon first login.\n\nIf you have trouble accessing the portal, visit the MIS Office at the 2nd Floor, IT Building, or contact mis@olivarezcollege.edu.ph.\n\nNote: Always log out after using the portal, especially on shared devices.`,
      source: 'MIS Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-02-01T08:00:00Z',
      lastUpdated: '2026-07-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Clearance Procedure',
      category: 'Procedures',
      content: `Students are required to process clearance at the end of each semester.\n\nClearance Procedure:\n1. Obtain a Clearance Form from the Registrar's Office.\n2. Have it signed by the following:\n   • Department Head\n   • Library\n   • Laboratory (if applicable)\n   • Cashier's Office (no outstanding balance)\n   • Student Affairs Office\n   • Guidance Office\n3. Submit the fully signed clearance form to the Registrar's Office.\n\nNote:\n• Clearance must be completed before enrollment for the next semester.\n• Graduating students must accomplish clearance before claiming their diploma.\n• Clearance forms with missing signatures will not be accepted.`,
      source: 'Registrar\'s Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-20T08:00:00Z',
      lastUpdated: '2026-06-15T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Tuition Fee Information',
      category: 'FAQs',
      content: `Frequently Asked Questions about Tuition Fees:\n\nQ: How much is the tuition per semester?\nA: Tuition fees vary by program and year level. Please visit the Cashier's Office or the school portal for the specific assessment.\n\nQ: What payment modes are available?\n• Full payment\n• Bi-monthly installment\n• Monthly installment\n\nQ: Is there a discount for full payment?\nA: Yes, students who pay in full during the enrollment period may avail of a discount. Contact the Cashier's Office for current rates.\n\nQ: What happens if I can't pay on time?\nA: Visit the Cashier's Office to discuss a payment arrangement. Failure to settle balances may affect enrollment for the next semester.\n\nQ: Can I pay online?\nA: Yes, payments can be made through the student portal or via designated bank transfers.`,
      source: 'Cashier\'s Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-02-01T08:00:00Z',
      lastUpdated: '2026-07-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'School Contact Information',
      category: 'FAQs',
      content: `Olivarez College Contact Information:\n\nMain Campus Address:\nOlivarez College, Dr. A. Santos Avenue,\nSucat, Parañaque City, Metro Manila\n\nContact Numbers:\n• Trunkline: (02) 8825-XXXX\n• Admissions: (02) 8825-XXXX loc. 101\n• Registrar: (02) 8825-XXXX loc. 102\n• Cashier: (02) 8825-XXXX loc. 103\n\nEmail:\n• General: info@olivarezcollege.edu.ph\n• Admissions: admissions@olivarezcollege.edu.ph\n• Registrar: registrar@olivarezcollege.edu.ph\n\nWebsite: www.olivarezcollege.edu.ph\n\nOffice Hours:\n• Monday to Friday: 8:00 AM – 5:00 PM\n• Saturday: 8:00 AM – 12:00 PM`,
      source: 'Olivarez College Official Information',
      status: 'active',
      dateAdded: '2026-01-10T08:00:00Z',
      lastUpdated: '2026-07-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'School Hours and Schedule',
      category: 'FAQs',
      content: `Olivarez College Operating Hours:\n\nRegular Class Schedule:\n• Morning classes: 7:00 AM – 12:00 PM\n• Afternoon classes: 1:00 PM – 6:00 PM\n• Evening classes: 6:00 PM – 9:00 PM (selected programs)\n\nCampus Gate Hours:\n• Gate opens: 6:00 AM\n• Gate closes: 9:30 PM\n\nOffice Hours:\n• Monday to Friday: 8:00 AM – 5:00 PM\n• Saturday: 8:00 AM – 12:00 PM\n• Sunday / Holidays: Closed\n\nNote: Schedule may change during examination periods, special events, or as announced by the administration.`,
      source: 'Student Affairs Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-10T08:00:00Z',
      lastUpdated: '2026-06-10T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Programs Offered',
      category: 'Academic Information',
      content: `Olivarez College offers the following programs:\n\nCollege Programs:\n• Bachelor of Science in Information Technology (BSIT)\n• Bachelor of Science in Business Administration (BSBA)\n  — Major in Marketing Management\n  — Major in Financial Management\n• Bachelor of Science in Criminology (BSCrim)\n• Bachelor of Elementary Education (BEEd)\n• Bachelor of Secondary Education (BSEd)\n  — Major in English\n  — Major in Mathematics\n• Bachelor of Science in Hospitality Management (BSHM)\n• Bachelor of Science in Tourism Management (BSTM)\n\nSenior High School Strands:\n• STEM (Science, Technology, Engineering, Mathematics)\n• ABM (Accountancy, Business, and Management)\n• HUMSS (Humanities and Social Sciences)\n• TVL (Technical-Vocational-Livelihood)\n\nFor detailed curriculum information, contact the Admissions Office.`,
      source: 'Admissions Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-10T08:00:00Z',
      lastUpdated: '2026-07-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Dean\'s Office Information',
      category: 'Offices',
      content: `Each academic department has its own Dean's Office:\n\n• College of Information Technology — 2nd Floor, IT Building\n• College of Business Administration — 3rd Floor, Main Building\n• College of Education — 2nd Floor, Education Building\n• College of Criminology — Ground Floor, Criminology Building\n• College of Hospitality & Tourism — 2nd Floor, HM Building\n\nThe Dean's Office handles:\n• Academic advising\n• Subject pre-registration\n• Academic concerns and appeals\n• Faculty coordination\n• Student academic records review\n• Course overload/underload requests\n\nOffice Hours: Monday to Friday, 8:00 AM – 5:00 PM\n\nStudents should consult their respective Dean's Office for program-specific concerns.`,
      source: 'Academic Affairs — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-15T08:00:00Z',
      lastUpdated: '2026-06-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Academic Honesty Policy',
      category: 'Policies',
      content: `Olivarez College Academic Honesty Policy:\n\nAcademic dishonesty includes, but is not limited to:\n• Cheating during examinations\n• Plagiarism in papers, projects, and assignments\n• Fabrication of data or sources\n• Unauthorized collaboration\n• Submitting the same work for multiple classes without permission\n\nConsequences:\n• First offense: Written warning and a grade of zero on the assignment/exam\n• Second offense: Failing grade in the subject\n• Third offense: Possible suspension or expulsion\n\nAll cases are reviewed by the Academic Discipline Committee.\n\nStudents are encouraged to maintain academic integrity and report violations to their instructors or the Dean's Office.`,
      source: 'Student Handbook — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-20T08:00:00Z',
      lastUpdated: '2026-05-15T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Chapel and Campus Ministry',
      category: 'Facilities',
      content: `The Olivarez College Chapel is located at the 2nd Floor of the Student Services Building.\n\nThe Campus Ministry Office provides:\n• Daily prayer services\n• Weekly Mass schedule (Wednesday, 12:00 PM)\n• Retreats and Recollections\n• Outreach programs\n• Spiritual counseling\n• Values formation activities\n\nThe chapel is open from 7:00 AM to 5:00 PM, Monday to Friday.\n\nAll students, regardless of religion, are welcome to use the chapel for quiet reflection and prayer.\n\nFor inquiries about Campus Ministry programs, visit the Campus Ministry Office beside the Chapel.`,
      source: 'Campus Ministry — Olivarez College',
      status: 'active',
      dateAdded: '2026-02-01T08:00:00Z',
      lastUpdated: '2026-05-01T08:00:00Z'
    },
    {
      id: _uid(),
      title: 'Transferee Admission Procedure',
      category: 'Procedures',
      content: `For students transferring to Olivarez College:\n\n1. Visit the Admissions Office with your Transfer Credential / Honorable Dismissal.\n2. Submit the following requirements:\n   • Transfer Credential / Honorable Dismissal\n   • Transcript of Records (original)\n   • Certificate of Good Moral Character\n   • PSA Birth Certificate (original and photocopy)\n   • 2x2 ID photos (4 pieces)\n3. Fill out the Transferee Application Form.\n4. Your credits will be evaluated by the Registrar's Office and the Department Head.\n5. Attend the interview at the Guidance Office.\n6. Once evaluated and accepted, proceed to the Cashier's Office for payment.\n7. Complete enrollment at the Registrar's Office.\n\nNote: Credit transfer is subject to curriculum compatibility. Processing takes 5–7 working days.`,
      source: 'Admissions Office — Olivarez College',
      status: 'active',
      dateAdded: '2026-01-15T08:00:00Z',
      lastUpdated: '2026-06-20T08:00:00Z'
    }
  ];

  // ── Utility: generate unique ID ──
  function _uid() {
    return 'kb_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // ── Load from storage or seed ──
  function _load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* fall through */ }
    }
    // Seed
    _save(SEED_DATA);
    return SEED_DATA;
  }

  function _save(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function _loadCategories() {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* fall through */ }
    }
    _saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }

  function _saveCategories(cats) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  }

  // ── Public API ──

  function getAllEntries() {
    return _load();
  }

  function getEntry(id) {
    return _load().find(e => e.id === id) || null;
  }

  function addEntry({ title, category, content, source, status = 'active' }) {
    const entries = _load();
    const entry = {
      id: _uid(),
      title,
      category,
      content,
      source: source || '',
      status,
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    entries.unshift(entry);
    _save(entries);
    return entry;
  }

  function updateEntry(id, data) {
    const entries = _load();
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) return null;
    entries[idx] = {
      ...entries[idx],
      ...data,
      lastUpdated: new Date().toISOString()
    };
    _save(entries);
    return entries[idx];
  }

  function deleteEntry(id) {
    let entries = _load();
    const len = entries.length;
    entries = entries.filter(e => e.id !== id);
    _save(entries);
    return entries.length < len;
  }

  function getCategories() {
    return _loadCategories();
  }

  function addCategory(name) {
    const cats = _loadCategories();
    if (!cats.includes(name)) {
      cats.push(name);
      _saveCategories(cats);
    }
    return cats;
  }

  function deleteCategory(name) {
    let cats = _loadCategories();
    cats = cats.filter(c => c !== name);
    _saveCategories(cats);
    return cats;
  }

  /**
   * Search entries by query string.
   * Returns sorted array of { entry, score }.
   */
  function searchEntries(query, category = null) {
    let entries = _load().filter(e => e.status === 'active');
    if (category) {
      entries = entries.filter(e => e.category === category);
    }

    if (!query || !query.trim()) {
      return entries.map(e => ({ entry: e, score: 0 }));
    }

    const q = query.toLowerCase().trim();
    const qTokens = _tokenize(q);

    const results = [];

    for (const entry of entries) {
      let score = 0;
      const titleLower = entry.title.toLowerCase();
      const contentLower = entry.content.toLowerCase();
      const categoryLower = entry.category.toLowerCase();

      // Exact title match (high score)
      if (titleLower.includes(q)) {
        score += 50;
      }

      // Token matching
      for (const token of qTokens) {
        if (token.length < 2) continue;
        if (titleLower.includes(token)) score += 15;
        if (contentLower.includes(token)) score += 5;
        if (categoryLower.includes(token)) score += 8;
      }

      // Bonus for multiple token hits
      const hitCount = qTokens.filter(t => t.length >= 2 && (titleLower.includes(t) || contentLower.includes(t))).length;
      if (hitCount >= 2) score += hitCount * 3;

      if (score > 0) {
        results.push({ entry, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  function _tokenize(text) {
    // Remove common stop words and split
    const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'it', 'this', 'that', 'do', 'does', 'how', 'what', 'where', 'when', 'who', 'which', 'can', 'i', 'my', 'me', 'we', 'our', 'you', 'your', 'about', 'with', 'from', 'by', 'be', 'been', 'being', 'have', 'has', 'had']);
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w));
  }

  function getStats() {
    const entries = _load();
    const cats = _loadCategories();
    const active = entries.filter(e => e.status === 'active').length;
    const draft = entries.filter(e => e.status === 'draft').length;
    const catCounts = {};
    for (const e of entries) {
      catCounts[e.category] = (catCounts[e.category] || 0) + 1;
    }
    return {
      total: entries.length,
      active,
      draft,
      categories: cats.length,
      catCounts
    };
  }

  /**
   * Reset to seed data (for dev/testing).
   */
  function resetToSeed() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    return _load();
  }

  return {
    getAllEntries,
    getEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    searchEntries,
    getCategories,
    addCategory,
    deleteCategory,
    getStats,
    resetToSeed
  };
})();
