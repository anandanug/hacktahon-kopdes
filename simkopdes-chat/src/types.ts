export interface Message {
  id: string;
  sender: "user" | "bot" | "admin" | "center";
  text: string;
  timestamp: string;
  status?: "sent" | "delivered" | "read";
  isPromo?: boolean;
  promoPrice?: number;
  promoStatus?: "idle" | "loading" | "success" | "error";
  productId?: string;
  productName?: string;
  bookingInfo?: {
    productName: string;
    price: number;
    bookingCode: string;
    status: string;
  };
}

export interface Contact {
  id: "bot" | "admin" | "center";
  name: string;
  avatarUrl: string;
  avatarLetter?: string;
  status: "Online" | "Offline" | "Typing...";
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  promoPrice?: number;
  unit: string;
  category: string;
  stock: number;
  description: string;
  imageUrl: string;
  isPromo: boolean;
}

export interface Booking {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  customerName: string;
  bookingCode: string;
  status: "Pending" | "Confirmed" | "Completed";
  createdAt: string;
}

export interface Announcement {
  id: string;
  author: string;
  avatarLetter: string;
  text: string;
  time: string;
  tag: string;
}

export interface Channel {
  id: string;
  title: string;
  icon: string;
  unread: boolean;
  lastPost: string;
  time: string;
}

export interface Community {
  id: string;
  name: string;
  membersCount: string;
  description: string;
  icon: string;
}
