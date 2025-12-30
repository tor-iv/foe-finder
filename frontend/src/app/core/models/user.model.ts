export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  hasCompletedQuestionnaire: boolean;
  isMatched: boolean;
  isAdmin?: boolean;
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
  };
}
