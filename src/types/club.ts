export interface Club {
  id: string;
  name: string;
  location: string;
  contactInfo: string | null;
  openingHours: string | null;
  logo: string | null;
  createdAt: string;
}

export interface ClubFormData {
  name: string;
  location: string;
  contactInfo: string;
  openingHours: string;
  logo: string;
}
