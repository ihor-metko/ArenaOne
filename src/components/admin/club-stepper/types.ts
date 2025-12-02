// Shared types for club stepper components

export interface UploadedFile {
  url: string;
  key: string;
  file?: File;
  preview?: string;
}

export interface BusinessHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface InlineCourt {
  id: string;
  name: string;
  type: string;
  surface: string;
  indoor: boolean;
  defaultPriceCents: number;
}

export interface StepperFormData {
  // Step 1: General Information
  name: string;
  slug: string;
  clubType: string;
  shortDescription: string;
  isPublic?: boolean;
  // Step 2: Contacts and Address
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  // Step 3: Business Hours
  businessHours: BusinessHour[];
  // Step 4: Courts
  courts: InlineCourt[];
  // Step 5: Gallery / Images
  logo: UploadedFile | null;
  gallery: UploadedFile[];
}

export interface StepProps {
  formData: StepperFormData;
  fieldErrors: Record<string, string>;
  isSubmitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBusinessHoursChange?: (hours: BusinessHour[]) => void;
  onLogoChange?: (file: UploadedFile | null) => void;
  onGalleryAdd?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGalleryRemove?: (index: number) => void;
  onAddCourt?: () => void;
  onRemoveCourt?: (id: string) => void;
  onCourtChange?: (id: string, field: keyof InlineCourt, value: string | boolean | number) => void;
  mode?: "create" | "edit";
}

export const CLUB_TYPES = [
  { value: "padel", label: "Padel" },
];

export const STEPS = [
  { id: 1, label: "General" },
  { id: 2, label: "Contacts" },
  { id: 3, label: "Hours" },
  { id: 4, label: "Courts" },
  { id: 5, label: "Gallery" },
];

export const initialBusinessHours: BusinessHour[] = [
  { dayOfWeek: 0, openTime: "09:00", closeTime: "21:00", isClosed: true },
  { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false },
  { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false },
  { dayOfWeek: 3, openTime: "09:00", closeTime: "21:00", isClosed: false },
  { dayOfWeek: 4, openTime: "09:00", closeTime: "21:00", isClosed: false },
  { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
  { dayOfWeek: 6, openTime: "10:00", closeTime: "20:00", isClosed: false },
];

export const initialFormData: StepperFormData = {
  name: "Padel Pulse Arena",
  slug: "",
  clubType: "",
  shortDescription: "Сучасний падел-клуб у центрі міста з професійними кортами і тренерською командою.",
  address: "вул. Спортивна 12, Київ",
  city: "Київ",
  postalCode: "12345",
  phone: "+380501234567",
  email: "info@padelpulsearena.ua",
  website: "https://padelpulsearena.ua",
  businessHours: initialBusinessHours,
  courts: [],
  logo: null,
  gallery: [],
};

export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
