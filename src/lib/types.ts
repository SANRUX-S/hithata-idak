export type VolunteerRole = "admin" | "supervisor" | "supporter";

export type AvailabilityStatus = "online" | "busy" | "offline";

export type TicketStatus = "waiting" | "assigned" | "active" | "awaiting_reply" | "closed";

export type PreferredLanguage = "si" | "en";

export interface Volunteer {
  id: string;
  email: string;
  display_name: string;
  role: VolunteerRole;
  is_active: number | boolean;
  is_approved: number | boolean;
  mfa_enabled?: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_ref: string;
  preferred_language: PreferredLanguage;
  topic?: string | null;
  status: TicketStatus;
  assigned_volunteer_id?: string | null;
  assigned_volunteer_name?: string | null;
  is_priority_review: number | boolean;
  is_safety_flagged: number | boolean;
  safety_notes?: string | null;
  feedback_rating?: number | null;
  feedback_text?: string | null;
  deletion_requested: number | boolean;
  deletion_requested_at?: string | null;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
}

export interface ConversationMessage {
  id: string;
  ticket_id: string;
  sender_role: "visitor" | "supporter" | "system";
  sender_name: string;
  content: string;
  created_at: string;
}

export interface PrivacyRequest {
  id: string;
  ticket_id: string;
  ticket_ref: string;
  request_type: "delete_conversation" | "export_data" | "general_privacy";
  status: "pending" | "processed" | "rejected";
  processed_by?: string | null;
  processed_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface IncidentReport {
  id: string;
  report_type: "supporter_behavior" | "privacy_concern" | "harassment" | "platform_misuse" | "technical_issue";
  ticket_ref?: string | null;
  description: string;
  contact_email?: string | null;
  status: "open" | "under_review" | "resolved";
  resolution_notes?: string | null;
  created_at: string;
}

export interface VolunteerApplication {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  languages: string;
  motivation: string;
  background: string;
  status: "pending" | "interview_scheduled" | "training" | "approved" | "rejected";
  notes?: string | null;
  created_at: string;
}

export interface UserFeedback {
  id: string;
  feedback_type: string;
  rating?: number | null;
  message: string;
  created_at: string;
}

export interface AdminAuditEvent {
  id: string;
  volunteer_id?: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details_safe: string;
  created_at: string;
}

export interface SystemAvailability {
  status: "available" | "busy" | "offline";
  activeSupportersCount: number;
  openTicketsCount: number;
  operatingHours: string;
  pilotMode: boolean;
}

export type CommunityCategory =
  | "feelings"
  | "anxiety"
  | "relationships"
  | "academic"
  | "questions"
  | "hope";

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author_alias: string;
  category: CommunityCategory;
  reactions_warmth: number;
  reactions_alone: number;
  reactions_insight: number;
  reply_count?: number;
  is_pinned: number | boolean;
  is_flagged: number | boolean;
  flag_reason?: string | null;
  status: "active" | "flagged" | "hidden" | "deleted";
  created_at: string;
  updated_at: string;
}

export interface CommunityReply {
  id: string;
  post_id: string;
  author_alias: string;
  is_supporter: number | boolean;
  content: string;
  is_flagged: number | boolean;
  status: "active" | "flagged" | "hidden" | "deleted";
  created_at: string;
}

export interface CommunityPostWithReplies extends CommunityPost {
  replies: CommunityReply[];
}

