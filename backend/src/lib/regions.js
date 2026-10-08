// Single source of truth for regions (state/UT -> cities).
// Served to the frontend via GET /api/regions so dropdowns never drift
// from what the backend accepts.
export const REGIONS = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur", "Eluru", "Ongole", "Machilipatnam", "Kondapalli", "Etikoppaka", "Srikalahasti", "Dharmavaram", "Mangalagiri", "Venkatagiri"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Tezu", "Along", "Roing", "Namsai"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Sivasagar", "Barpeta", "Sualkuchi", "Majuli", "Goalpara", "Karimganj"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah", "Begusarai", "Katihar", "Munger", "Madhubani", "Nalanda", "Sasaram", "Bihar Sharif", "Hajipur"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Kondagaon", "Dhamtari", "Kanker"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Canacona", "Pernem", "Quepem"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Bhuj", "Kutch", "Patan", "Morbi", "Surendranagar", "Porbandar", "Navsari", "Bharuch", "Mehsana", "Palanpur", "Dwarka"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Sonipat", "Yamunanagar", "Kurukshetra", "Panchkula", "Sirsa", "Bhiwani", "Jind", "Rewari"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Kullu", "Mandi", "Solan", "Chamba", "Kangra", "Palampur", "Bilaspur", "Una", "Hamirpur", "Kinnaur", "Spiti", "Nahan"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Ramgarh", "Dumka", "Chaibasa", "Khunti", "Palamu", "Lohardaga"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Ballari", "Shivamogga", "Tumakuru", "Davanagere", "Udupi", "Hassan", "Bidar", "Vijayapura", "Channapatna", "Mandya", "Chikkamagaluru", "Madikeri", "Kolar", "Hampi", "Ilkal", "Kinnal"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad", "Kannur", "Kottayam", "Malappuram", "Kasaragod", "Idukki", "Wayanad", "Pathanamthitta", "Aranmula", "Ernakulam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Chanderi", "Maheshwar", "Mandla", "Khajuraho", "Burhanpur", "Khandwa", "Singrauli", "Bagh", "Dindori", "Shahdol"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Thane", "Navi Mumbai", "Sangli", "Satara", "Nanded", "Latur", "Jalgaon", "Ahmednagar", "Paithan", "Sawantwadi", "Ratnagiri", "Chandrapur", "Yavatmal", "Pandharpur"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul", "Senapati", "Kakching", "Moirang", "Tamenglong", "Jiribam"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Cherrapunji", "Mawlynnong", "Williamnagar", "Baghmara", "Nongstoin", "Mairang"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Saiha", "Lawngtlai", "Mamit"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek", "Kiphire", "Longleng"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Raghurajpur", "Pipili", "Koraput", "Jeypore", "Angul", "Dhenkanal"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Moga", "Firozpur", "Kapurthala", "Sangrur", "Phagwara", "Fatehgarh Sahib", "Rupnagar"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Jaisalmer", "Bhilwara", "Alwar", "Sikar", "Pushkar", "Sanganer", "Bagru", "Barmer", "Nathdwara", "Bundi", "Chittorgarh", "Mount Abu", "Bharatpur", "Pali", "Tonk", "Sawai Madhopur"],
  "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Pelling", "Ravangla", "Jorethang", "Rangpo", "Singtam"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Thanjavur", "Kanchipuram", "Dindigul", "Kumbakonam", "Hosur", "Nagercoil", "Karur", "Tiruppur", "Mahabalipuram", "Pollachi", "Swamimalai", "Ooty", "Kodaikanal", "Cuddalore", "Namakkal", "Sivakasi"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahabubnagar", "Nalgonda", "Adilabad", "Siddipet", "Pochampally", "Nirmal", "Secunderabad", "Suryapet", "Medak", "Gadwal"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia", "Ambassa", "Khowai", "Teliamura", "Sabroom"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Meerut", "Ghaziabad", "Noida", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Firozabad", "Mathura", "Jhansi", "Mirzapur", "Bhadohi", "Khurja", "Ayodhya", "Rampur", "Farrukhabad", "Azamgarh", "Etawah", "Sambhal", "Chitrakoot", "Lakhimpur"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Nainital", "Roorkee", "Rudrapur", "Almora", "Mussoorie", "Pithoragarh", "Kashipur", "Bageshwar", "Chamoli", "Tehri", "Uttarkashi", "Champawat"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Darjeeling", "Bardhaman", "Malda", "Kharagpur", "Santiniketan", "Bishnupur", "Krishnanagar", "Cooch Behar", "Jalpaiguri", "Murshidabad", "Nadia", "Purulia", "Midnapore", "Kalimpong", "Shantipur"],
  "Andaman and Nicobar Islands": ["Port Blair", "Diglipur", "Mayabunder", "Rangat", "Car Nicobar", "Havelock", "Neil Island"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa", "Amli", "Khanvel"],
  "Delhi": ["New Delhi", "Delhi", "Dwarka", "Rohini", "Saket", "Karol Bagh", "Chandni Chowk", "Dilli Haat", "Lajpat Nagar", "Janakpuri"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Budgam", "Kupwara", "Pulwama", "Udhampur", "Kathua", "Rajouri", "Ganderbal", "Poonch", "Doda", "Samba"],
  "Ladakh": ["Leh", "Kargil", "Nubra", "Zanskar", "Diskit", "Drass"],
  "Lakshadweep": ["Kavaratti", "Agatti", "Minicoy", "Amini", "Andrott", "Kalpeni"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam", "Auroville", "Ozhukarai"],
};

export const STATES = Object.keys(REGIONS).sort((a, b) => a.localeCompare(b));

// Returns an error string, or null when (state, city) is a valid pair.
export const validateRegion = (state, city) => {
  if (!state || !city) return "State and city are required";
  const cities = REGIONS[state];
  if (!cities) return "Please choose a valid state";
  if (!cities.includes(city)) return "Please choose a valid city for the selected state";
  return null;
};

// Sorted-for-display copy of the map (does not mutate REGIONS).
export const regionsForClient = () =>
  Object.fromEntries(
    STATES.map((s) => [s, [...REGIONS[s]].sort((a, b) => a.localeCompare(b))])
  );
