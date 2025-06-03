// Firebase configuration - Hardcoded values
export const firebaseConfig = {
  apiKey: "AIzaSyD_3A14wSN28NxwUaegiFZu3E8y_dMLkRg",
  authDomain: "it-mngo.firebaseapp.com",
  databaseURL: "https://it-mngo-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "it-mngo",
  storageBucket: "it-mngo.firebasestorage.app",
  messagingSenderId: "1073556217824",
  appId: "1:1073556217824:web:05b835f4d34ce907fb1585",
  measurementId: "G-H8KBMTTQEM",
}

// Admin emails - your original admin emails
export const ADMIN_EMAILS = ["prottoy123mahmud@gmail.com", "xrupture.tw@gmail.com", "arprincedabbu@gmail.com"]

// Bangladesh districts for delivery calculation
export const BANGLADESH_DISTRICTS = [
  "Dhaka",
  "Chittagong",
  "Rajshahi",
  "Khulna",
  "Barisal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
  "Comilla",
  "Narayanganj",
  "Gazipur",
  "Tangail",
  "Jamalpur",
  "Sherpur",
  "Netrokona",
  "Kishoreganj",
  "Manikganj",
  "Munshiganj",
  "Narsingdi",
  "Faridpur",
  "Gopalganj",
  "Madaripur",
  "Rajbari",
  "Shariatpur",
  "Brahmanbaria",
  "Chandpur",
  "Lakshmipur",
  "Noakhali",
  "Feni",
  "Cox's Bazar",
  "Bandarban",
  "Rangamati",
  "Khagrachhari",
  "Patuakhali",
  "Pirojpur",
  "Jhalokati",
  "Barguna",
  "Bhola",
  "Jessore",
  "Narail",
  "Magura",
  "Satkhira",
  "Meherpur",
  "Chuadanga",
  "Kushtia",
  "Jhenaidah",
  "Bogra",
  "Joypurhat",
  "Naogaon",
  "Natore",
  "Chapainawabganj",
  "Pabna",
  "Sirajganj",
  "Habiganj",
  "Moulvibazar",
  "Sunamganj",
  "Kurigram",
  "Lalmonirhat",
  "Nilphamari",
  "Panchagarh",
  "Thakurgaon",
  "Dinajpur",
  "Gaibandha",
]

// Delivery charge calculation
export const calculateDeliveryCharge = (district: string): number => {
  const dhakaCityDistricts = ["Dhaka", "Narayanganj", "Gazipur", "Manikganj", "Munshiganj", "Narsingdi"]

  if (dhakaCityDistricts.includes(district)) {
    return 60 // Inside Dhaka
  } else {
    return 120 // Outside Dhaka
  }
}
