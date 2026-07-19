"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User, HelpCircle, Loader2, MessageSquare, Plus, Paperclip, X, Image as ImageIcon, ArrowLeft, ChevronDown, Copy, CheckCircle2, XCircle, Check, Menu } from "lucide-react";
import { useAppSelector } from "@/redux/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastProvider";
import { useGetAllTransactionMutation, useGetAllTypeDetailTransactionMutation } from "@/redux/transaction/transaction_history";
import { TokenManager } from "@/utils/token-manager";
import { useSearchParams } from "next/navigation";
import { app_config, brandColor } from "@/utils/config";
import { CenterModal } from "@/components/modals/CenterModal";
import { useTheme } from "@/context/ThemeProvider";
import { colorThemes } from "@/styles/theme";
import { AnimatePresence, motion } from "motion/react";

// Firebase imports
import { getAuth, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { auth as fbAuth } from "@/lib/firebase";
import {
  subscribeToMessages,
  subscribeToUserChats,
  sendUserMessage,
  sendImageMessage,
  createTradeChat,
  markChatReadByUser,
  closeChat,
  reopenChat,
  type ChatDocument,
  type MessageDocument,
} from "@/lib/firebase-chat-service";

function MessagesContent() {
  const { theme } = useTheme();

  const user = useAppSelector((state: any) => state.auth.user);
  const { showToast } = useToast();
  const [getAllTransactions, { isLoading: isFetchingTx }] = useGetAllTransactionMutation();

  const searchParams = useSearchParams();
  const queryTradeId = searchParams.get("tradeId");
  const queryCardName = searchParams.get("cardName");
  const queryCardCategory = searchParams.get("cardCategory");
  const queryAmount = searchParams.get("amount");

  const [activeRoomId, setActiveRoomId] = useState<string>("zoho_support");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth & UI States
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [showSidebar, setShowSidebar] = useState(false);
  const [firestoreRooms, setFirestoreRooms] = useState<ChatDocument[]>([]);
  const activeRoom = firestoreRooms.find((r) => r.chatId === activeRoomId);
  const [activeMessages, setActiveMessages] = useState<MessageDocument[]>([]);
  const [apiTrades, setApiTrades] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  // Trade Details & Modal States
  const [getAllTypeDetailTransaction] = useGetAllTypeDetailTransactionMutation();
  const [isEndChatModalOpen, setIsEndChatModalOpen] = useState(false);
  const [isTradeDetailsModalOpen, setIsTradeDetailsModalOpen] = useState(false);
  const [isFallbackSupportModalOpen, setIsFallbackSupportModalOpen] = useState(false);
  const [tradeDetails, setTradeDetails] = useState<any>(null);
  const [tradeImages, setTradeImages] = useState<any[]>([]);
  const [isFetchingTradeDetails, setIsFetchingTradeDetails] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCreatingSupportRoom, setIsCreatingSupportRoom] = useState(false);
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);

  // Handle query parameter auto-initialization/room selection
  useEffect(() => {
    const userName = user?.user?.username || user?.username || `${app_config.name} User`;
    if (!isFirebaseReady || !firebaseUid || !queryTradeId) return;

    const expectedChatId = `trade_${queryTradeId}`;

    // Check if room already exists in fetched rooms
    const existingRoom = firestoreRooms.find((r) => r.chatId === expectedChatId);
    if (existingRoom) {
      setActiveRoomId(expectedChatId);
      setMobileView("chat");
      return;
    }

    // Otherwise, create the chat room automatically
    const autoCreateRoom = async () => {
      try {
        const amtStr = queryAmount ? `₦${Number(queryAmount).toLocaleString()}` : "0";
        const createdId = await createTradeChat({
          tradeId: String(queryTradeId),
          userId: firebaseUid,
          userName: userName,
          cardName: queryCardName || "Transaction",
          cardCategory: queryCardCategory || "Trade Support",
          cardAmount: amtStr,
          settlementAmount: amtStr,
          chatType: "trade",
        });
        setActiveRoomId(createdId);
        setMobileView("chat");
      } catch (err) {
        console.error("Failed to auto-create trade chat room:", err);
      }
    };

    autoCreateRoom();
  }, [isFirebaseReady, firebaseUid, queryTradeId, queryCardName, queryCardCategory, queryAmount, firestoreRooms, user]);

  // Sync Firebase Auth State & capture Firebase UID (matching mobile useChatList hook)
  useEffect(() => {
    const authInstance = fbAuth;
    const token = TokenManager.getFirebaseToken();

    const unsubscribe = onAuthStateChanged(authInstance, (fbUser) => {
      if (fbUser) {
        setFirebaseUid(fbUser.uid);
        setIsFirebaseReady(true);
      } else if (token) {
        signInWithCustomToken(authInstance, token)
          .then((cred) => {
            setFirebaseUid(cred.user.uid);
            setIsFirebaseReady(true);
          })
          .catch((err) => {
            console.error("Firebase custom token log in error:", err);
          });
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync the active room when rooms list loads and none is active (matching mobile chat tab default focus)
  useEffect(() => {
    if (activeRoomId === "zoho_support" && firestoreRooms.length > 0 && !queryTradeId) {
      setActiveRoomId(firestoreRooms[0].chatId);
    }
  }, [firestoreRooms, activeRoomId, queryTradeId]);

  // Fetch Firestore Chat Rooms list using Firebase Auth UID (matching mobile useChatList)
  useEffect(() => {
    if (!isFirebaseReady || !firebaseUid) return;

    const unsubscribe = subscribeToUserChats(firebaseUid, (chats) => {
      setFirestoreRooms(chats);
    });

    return () => unsubscribe();
  }, [isFirebaseReady, firebaseUid]);

  // Mark chat as read when selecting a room
  useEffect(() => {
    if (activeRoomId && activeRoomId !== "zoho_support" && isFirebaseReady) {
      markChatReadByUser(activeRoomId).catch((err) =>
        console.warn("[FirebaseChat] Failed to mark chat read:", err)
      );
    }
  }, [activeRoomId, isFirebaseReady]);

  // Fetch real-time message stream for active room
  useEffect(() => {
    if (!isFirebaseReady || !activeRoomId || activeRoomId === "zoho_support") {
      setActiveMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(activeRoomId, (msgs) => {
      setActiveMessages(msgs);
    });

    return () => unsubscribe();
  }, [isFirebaseReady, activeRoomId]);

  // Query recent API transactions to find ongoing trade rooms
  useEffect(() => {
    const fetchApiTrades = async () => {
      try {
        const token = TokenManager.getToken();
        if (!token) return;
        const res = await getAllTransactions({ data: { limit: 20, page: 1 } }).unwrap();
        const list = res?.data?.transactions || res?.transactions || [];
        if (Array.isArray(list)) {
          // Filter for trade transactions
          const filtered = list.filter((t: any) => t.type === "giftcard" || t.type === "crypto");
          setApiTrades(filtered);
        }
      } catch (err) {
        console.error("Failed to load transaction trades list:", err);
      }
    };
    fetchApiTrades();
  }, [getAllTransactions]);

  // Fetch detailed transaction data for the active trade chat
  useEffect(() => {
    if (!activeRoomId || activeRoomId === "zoho_support" || activeRoom?.type === "support") {
      setTradeDetails(null);
      setTradeImages([]);
      return;
    }

    const fetchDetailedTrade = async () => {
      if (!activeRoom?.tradeId) return;
      setIsFetchingTradeDetails(true);
      try {
        const response = await getAllTypeDetailTransaction({
          data: {
            transid: activeRoom.tradeId,
            role: "giftcard", // Always query details for giftcard trade chats
          },
        }).unwrap();
        if (response?.status === "success") {
          setTradeDetails(response?.transaction);
          setTradeImages(response?.images || []);
        }
      } catch (err) {
        console.error("Failed to load detailed trade info:", err);
      } finally {
        setIsFetchingTradeDetails(false);
      }
    };

    fetchDetailedTrade();
  }, [activeRoomId, activeRoom?.tradeId, activeRoom?.type]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  // Auto-trigger Zoho SalesIQ when selecting general live support
  useEffect(() => {
    if (activeRoomId === "zoho_support") {
      handleStartZoho();
    }
  }, [activeRoomId]);

  // Zoho Launcher handler
  const handleStartZoho = () => {
    if (typeof window === "undefined") return;

    if (document.getElementById("zsiqscript")) {
      const zoho = (window as any).$zoho;
      if (zoho?.salesiq?.chat?.start) {
        try {
          zoho.salesiq.chat.start();
        } catch (e) {
          console.error("Zoho error:", e);
        }
      }
      return;
    }

    const widgetCode = process.env.NEXT_PUBLIC_ZOHO_WIDGET_CODE || "siqf9dfb10705a60e0a514d7a8e52a92baefd1645e99caef201c10756782ff79601";

    (window as any).$zoho = (window as any).$zoho || {};
    (window as any).$zoho.salesiq = (window as any).$zoho.salesiq || {
      widgetcode: widgetCode,
      values: {},
      ready: function () {
        if ((window as any).$zoho.salesiq.floatwindow?.visible) {
          (window as any).$zoho.salesiq.floatwindow.visible("hide");
        }
        if ((window as any).$zoho.salesiq.chat?.start) {
          try {
            (window as any).$zoho.salesiq.chat.start();
          } catch (e) {
            console.error("Zoho error on start:", e);
          }
        }
      },
    };

    const d = document;
    const s = d.createElement("script");
    s.type = "text/javascript";
    s.id = "zsiqscript";
    s.defer = true;
    s.src = "https://salesiq.zoho.com/widget";
    const t = d.getElementsByTagName("script")[0];
    if (t && t.parentNode) {
      t.parentNode.insertBefore(s, t);
    } else {
      d.body.appendChild(s);
    }
  };

  // Create general Firebase support session (fallback overall support chat)
  const handleCreateGeneralSupport = async () => {
    if (!firebaseUid) {
      showToast("Please log in to start a support chat.", "error");
      return;
    }
    setIsCreatingSupportRoom(true);
    try {
      const userName = user?.user?.username || user?.username || `${app_config.name} User`;
      const userAvatar = user?.user?.profile_picture || null;

      const chatId = await createTradeChat({
        tradeId: "", // Empty tradeId means overall support chat
        userId: firebaseUid,
        userName: userName,
        userAvatar: userAvatar,
        cardName: "",
        cardCategory: "Support",
        cardAmount: "",
        settlementAmount: "",
        chatType: "support",
      });

      setActiveRoomId(chatId);
      setIsFallbackSupportModalOpen(false);
      setMobileView("chat");
      showToast("Support session loaded!", "success");
    } catch (err) {
      showToast("Failed to start support session.", "error");
    } finally {
      setIsCreatingSupportRoom(false);
    }
  };

  // Launch a new trade chat session directly from dashboard
  const handleCreateTradeRoom = async (tx: any) => {
    const userName = user?.user?.username || user?.username || `${app_config.name} User`;
    if (!firebaseUid) {
      showToast("Please verify login to access chat room creation.", "error");
      return;
    }

    try {
      showToast("Initializing trade session...", "info");
      const chatId = await createTradeChat({
        tradeId: String(tx.id),
        userId: firebaseUid,
        userName: userName,
        cardName: tx.title || "Gift Card",
        cardCategory: tx.description || "Gift Card Trade",
        cardAmount: tx.amount ? `₦${Number(tx.amount).toLocaleString()}` : "0",
        settlementAmount: tx.amount ? `₦${Number(tx.amount).toLocaleString()}` : "0",
        chatType: "trade",
      });

      setActiveRoomId(chatId);
      setMobileView("chat");
      showToast("Trade chat session loaded!", "success");
    } catch (err) {
      showToast("Failed to initialize trade chat.", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;
    if (activeRoomId === "zoho_support") return;

    const senderUid = firebaseUid || user?.user?.id || user?.id || "user";
    const userName = user?.user?.username || user?.username || `${app_config.name} User`;

    setSending(true);
    try {
      if (selectedFile) {
        await sendImageMessage(
          activeRoomId,
          String(senderUid),
          userName,
          null,
          selectedFile
        );
      } else {
        await sendUserMessage(
          activeRoomId,
          String(senderUid),
          userName,
          null,
          inputText
        );
      }

      setInputText("");
      setSelectedFile(null);
      setFilePreview(null);
    } catch (err) {
      showToast("Failed to post support message.", "error");
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "";
    try {
      let date: Date;
      if (ts instanceof Date) {
        date = ts;
      } else if (typeof ts.toDate === "function") {
        date = ts.toDate();
      } else if (typeof ts.seconds === "number") {
        date = new Date(ts.seconds * 1000);
      } else if (ts._seconds) {
        date = new Date(ts._seconds * 1000);
      } else {
        date = new Date(ts);
      }

      if (isNaN(date.getTime())) return "";

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch { return ""; }
  };

  const formatMessageTime = (ts: any) => {
    if (!ts) return "";
    try {
      let date: Date;
      if (ts instanceof Date) {
        date = ts;
      } else if (typeof ts.toDate === "function") {
        date = ts.toDate();
      } else if (typeof ts.seconds === "number") {
        date = new Date(ts.seconds * 1000);
      } else if (ts._seconds) {
        date = new Date(ts._seconds * 1000);
      } else {
        date = new Date(ts);
      }

      if (isNaN(date.getTime())) return "";
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  const cleanAndFormat = (val: any, prefix: string) => {
    if (val === undefined || val === null || val === "") return "";
    const cleanStr = String(val).replace(/[₦$,\s]/g, "");
    const parsed = parseFloat(cleanStr);
    if (isNaN(parsed)) {
      const numMatch = cleanStr.match(/[\d.]+/);
      if (numMatch) {
        const extracted = parseFloat(numMatch[0]);
        if (!isNaN(extracted)) {
          return `${prefix}${extracted.toLocaleString("en-US")}`;
        }
      }
      return String(val);
    }
    return `${prefix}${parsed.toLocaleString("en-US")}`;
  };

  // Chat room title for sidebar (matching mobile renderChatItem)
  const getRoomTitle = (room: ChatDocument) => {
    const isAppSupport = room.type === "support" && !room.tradeId;
    return isAppSupport ? "Gift Card Support" : `Trade Support ~ ${room.cardName || "Gift Card"}`;
  };

  const getActiveRoomTitle = () => {
    if (activeRoomId === "zoho_support") return "App Support";
    const found = firestoreRooms.find((r) => r.chatId === activeRoomId);
    if (!found) return "Trade Chat Window";
    return getRoomTitle(found);
  };

  const getActiveRoomSubtitle = () => {
    if (activeRoomId === "zoho_support") return "Zoho Live Chat";
    const found = firestoreRooms.find((r) => r.chatId === activeRoomId);
    if (!found) return "";
    if (found.assignedAgentName) return `Agent: ${found.assignedAgentName}`;
    return found.tradeId ? `Trade ID: #${found.tradeId}` : `${app_config.name} customer support`;
  };

  const isChatClosed = activeRoom?.chatStatus === "closed";

  const handleEndChat = () => {
    setIsEndChatModalOpen(true);
  };

  const confirmEndChat = async () => {
    if (!activeRoomId || activeRoomId === "zoho_support") return;
    try {
      await closeChat(activeRoomId);
      showToast("Chat closed.", "info");
      setIsEndChatModalOpen(false);
    } catch {
      showToast("Failed to close chat.", "error");
    }
  };

  const handleReopenChat = async () => {
    if (!activeRoomId || activeRoomId === "zoho_support") return;
    try {
      await reopenChat(activeRoomId);
      showToast("Chat reopened.", "success");
    } catch { showToast("Failed to reopen chat.", "error"); }
  };

  // Helper helpers to format trade status colors
  const getStatusColor = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "successful" || s === "1" || s === "success") return "#10B981"; // green-500
    if (s === "rejected" || s === "2" || s === "failed" || s === "reject") return "#EF4444"; // red-500
    return "#F59E0B"; // amber-500 for pending
  };

  const getStatusBgColor = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "successful" || s === "1" || s === "success") return "rgba(16, 185, 129, 0.1)";
    if (s === "rejected" || s === "2" || s === "failed" || s === "reject") return "rgba(239, 68, 68, 0.1)";
    return "rgba(245, 158, 11, 0.1)";
  };

  const getStatusLabel = (status: string) => {
    const s = String(status).toLowerCase();
    if (s === "successful" || s === "1" || s === "success") return "successful";
    if (s === "rejected" || s === "2" || s === "failed" || s === "reject") return "rejected";
    return "pending";
  };

  // Skeleton components
  const ChatListSkeleton = () => (
    <div className="flex flex-col animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="px-5 py-4 flex gap-3.5 border-b border-border-light/20 dark:border-border-dark/20">
          <div className="w-11 h-11 rounded-full bg-light-200 dark:bg-dark-700 shrink-0" />
          <div className="flex-1 flex flex-col gap-2 py-0.5">
            <div className="h-3.5 w-3/4 bg-light-200 dark:bg-dark-700 rounded-lg" />
            <div className="h-3 w-1/2 bg-light-150 dark:bg-dark-800 rounded-lg" />
          </div>
          <div className="flex flex-col items-end gap-2 py-0.5">
            <div className="h-3 w-8 bg-light-150 dark:bg-dark-800 rounded" />
            <div className="w-5 h-5 rounded-full bg-light-200 dark:bg-dark-700" />
          </div>
        </div>
      ))}
    </div>
  );

  const MessagesSkeleton = () => (
    <div className="flex-1 p-6 flex flex-col gap-5 animate-pulse">
      {/* System message skeleton */}
      <div className="self-center h-10 w-72 bg-light-100 dark:bg-dark-800/50 rounded-2xl" />
      {/* Agent message skeleton */}
      <div className="self-start flex flex-col gap-2 max-w-[65%]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-light-200 dark:bg-dark-700" />
          <div className="h-2.5 w-32 bg-light-200 dark:bg-dark-700 rounded" />
        </div>
        <div className="ml-8 h-16 w-64 bg-light-150 dark:bg-dark-800 rounded-2xl rounded-tl-none" />
        <div className="ml-8 h-2.5 w-12 bg-light-150 dark:bg-dark-800 rounded" />
      </div>
      {/* User message skeleton */}
      <div className="self-end flex flex-col gap-2 items-end max-w-[65%]">
        <div className="h-12 w-48 bg-primary-500/15 rounded-2xl rounded-tr-none" />
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-8 bg-light-150 dark:bg-dark-800 rounded" />
          <div className="h-2.5 w-20 bg-light-150 dark:bg-dark-800 rounded" />
          <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30" />
        </div>
      </div>
      {/* Another agent message */}
      <div className="self-start flex flex-col gap-2 max-w-[55%]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-light-200 dark:bg-dark-700" />
          <div className="h-2.5 w-32 bg-light-200 dark:bg-dark-700 rounded" />
        </div>
        <div className="ml-8 h-10 w-52 bg-light-150 dark:bg-dark-800 rounded-2xl rounded-tl-none" />
      </div>
    </div>
  );

  // Image component with error handling
  const ChatImage = ({ src, alt }: { src: string; alt: string }) => {
    const [hasError, setHasError] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    if (hasError) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-light-100 dark:bg-dark-800 rounded-xl border border-border-light dark:border-border-dark">
          <ImageIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark shrink-0" />
          <span className="text-[12px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">Image unavailable</span>
        </div>
      );
    }

    return (
      <div className="relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-sm max-w-[220px]">
        {isLoading && (
          <div className="absolute inset-0 bg-light-150 dark:bg-dark-700 animate-pulse flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className="max-h-52 object-cover w-full cursor-pointer hover:opacity-95 transition-opacity"
          onLoad={() => setIsLoading(false)}
          onError={() => { setHasError(true); setIsLoading(false); }}
        />
      </div>
    );
  };

  const renderSidebarContent = () => (
    <>
      <div className="p-5 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-light-50/90 dark:bg-dark-900/60 shrink-0">
        <h3 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
          Conversations
        </h3>
        <div className="flex items-center gap-2">
          <span className="bg-primary-500/10 text-primary-500 text-[10px] font-primary-bold px-2.5 py-0.5 rounded-full select-none shrink-0">
            {firestoreRooms.length + 1} Channels
          </span>
          {/* Close button visible below lg breakpoint at the top right */}
          {/* <button
            onClick={() => setShowSidebar(false)}
            className="p-1 rounded-full hover:bg-light-150 dark:hover:bg-dark-800 transition-colors lg:hidden text-text-primary-light dark:text-text-primary-dark cursor-pointer shrink-0"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button> */}
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto flex flex-col scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Zoho Channel — App Support (matching mobile renderHeader) */}
        <button
          onClick={() => {
            setActiveRoomId("zoho_support");
            setMobileView("chat");
            setShowSidebar(false);
            handleStartZoho();
          }}
          className={`w-full px-5 py-4 flex gap-3.5 text-left transition-all hover:bg-light-75 dark:hover:bg-dark-800/10 cursor-pointer border-b border-border-light/20 dark:border-border-dark/20 ${activeRoomId === "zoho_support" ? "bg-light-100 dark:bg-dark-800/20 border-l-4 border-l-primary-500" : "border-l-4 border-l-transparent"
            }`}
        >
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full flex items-center justify-center border border-[#E5E7EB] dark:border-[#333333] overflow-hidden bg-white dark:bg-[#111111]">
              <img src={app_config.LogoIconLight} alt={app_config.name} className="object-contain dark:hidden" />
              <img src={app_config.LogoIconDark} alt={app_config.name} className="object-contain hidden dark:block" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-900" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-[14px] font-primary-semibold text-text-primary-light dark:text-text-primary-dark truncate">
              App Support
            </span>
            <span className="text-[13px] font-primary-medium text-[#4B5563] dark:text-[#9CA3AF] truncate">
              Zoho Live Chat
            </span>
          </div>
        </button>

        {/* Loading Skeleton for chat list */}
        {!isFirebaseReady && <ChatListSkeleton />}

        {/* Firestore Chat Channels */}
        {firestoreRooms.map((room) => {
          const isActive = room.chatId === activeRoomId;
          const isAppSupport = room.type === "support" && !room.tradeId;
          return (
            <button
              key={room.chatId}
              onClick={() => {
                setActiveRoomId(room.chatId);
                setMobileView("chat");
                setShowSidebar(false);
              }}
              className={`w-full px-5 py-4 flex gap-3.5 text-left transition-all hover:bg-light-75 dark:hover:bg-dark-800/10 cursor-pointer border-b border-border-light/20 dark:border-border-dark/20 ${isActive ? "bg-light-100 dark:bg-dark-800/20 border-l-4 border-l-primary-500" : "border-l-4 border-l-transparent"
                }`}
            >
              {/* Avatar - matching mobile renderChatItem */}
              <div className="relative shrink-0">
                {isAppSupport ? (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center border border-[#E5E7EB] dark:border-[#333333] overflow-hidden ">
                    <img src={app_config.LogoIconLight} alt={app_config.name} className=" object-contain dark:hidden" />
                    <img src={app_config.LogoIconDark} alt={app_config.name} className=" object-contain hidden dark:block" />
                  </div>
                ) : room.cardImage && typeof room.cardImage === "string" && room.cardImage.startsWith("http") ? (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden">
                    <img
                      src={room.cardImage}
                      alt={room.cardName}
                      className="w-11 h-11 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center  overflow-hidden">
                    <img src={app_config.LogoIconLight} alt={app_config.name} className=" object-contain dark:hidden" />
                    <img src={app_config.LogoIconDark} alt={app_config.name} className=" object-contain hidden dark:block" />
                  </div>
                )}
                {/* Online indicator */}
                {room.chatStatus === "open" && room.assignedAgent && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-900" />
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="text-[14px] font-primary-semibold text-text-primary-light dark:text-text-primary-dark truncate">
                  {getRoomTitle(room)}
                </span>
                <span className="text-[13px] font-primary-medium text-[#4B5563] dark:text-[#9CA3AF] truncate">
                  {room.lastMessage || "No messages yet"}
                </span>
              </div>

              {/* Timestamp + Unread */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] font-primary-regular text-text-tertiary-light dark:text-text-tertiary-dark whitespace-nowrap">
                  {formatTimestamp(room.lastMessageAt)}
                </span>
                {room.unreadByUser > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-primary-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {room.unreadByUser > 9 ? "9+" : room.unreadByUser}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* API Trades — New Chat */}
        {apiTrades.length > 0 && (
          <div className="pt-5 px-4 pb-3">
            <span className="text-[10px] font-primary-bold text-text-tertiary-light dark:text-text-tertiary-dark uppercase tracking-wider block mb-3 pl-1 select-none">
              Start New Trade Chat
            </span>
            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto">
              {apiTrades
                .filter((t) => !firestoreRooms.some((fr) => fr.tradeId === String(t.id)))
                .map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => {
                      handleCreateTradeRoom(tx);
                      setShowSidebar(false);
                    }}
                    className="w-full text-left p-3 rounded-2xl border border-border-light dark:border-border-dark flex justify-between items-center bg-light-50 dark:bg-dark-900/20 hover:bg-light-100 dark:hover:bg-dark-800 transition-all cursor-pointer hover:border-primary-500/30"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark block truncate">
                        {tx.title || "Gift Card Swap"}
                      </span>
                      <span className="text-[10px] text-text-tertiary-light dark:text-text-tertiary-dark">
                        ID: #{tx.id}
                      </span>
                    </div>
                    <Plus className="w-4 h-4 text-primary-500 shrink-0" />
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex bg-surface-light dark:bg-surface-dark border-y border-border-light dark:border-border-dark md:border md:rounded-[30px] overflow-hidden h-[calc(100vh-104px)] md:h-[82vh] w-screen md:w-full -mx-6 md:mx-0 relative">

      {/* Sidebar Backdrop Overlay + Animated Panel on mobile/tablet when sidebar is open in chat view */}
      <AnimatePresence>
        {mobileView === "chat" && showSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="absolute inset-0 bg-black z-20 lg:hidden cursor-pointer"
            />

            {/* Sliding conversations panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute inset-y-0 left-0 z-30 w-[280px] bg-surface-light dark:bg-surface-dark shadow-2xl border-r border-border-light dark:border-border-dark flex flex-col shrink-0 lg:hidden"
            >
              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop / List-view Static Sidebar */}
      <div
        className={`flex-col shrink-0 bg-light-50/70 dark:bg-dark-900/40 border-r border-border-light dark:border-border-dark transition-all duration-200
          ${mobileView === "chat"
            ? "hidden lg:flex lg:w-[340px] xl:w-[360px]"
            : "w-full lg:w-[340px] xl:w-[360px] flex"
          }`}
      >
        {renderSidebarContent()}
      </div>
      {/* 2. Active Chat room */}
      <div
        className={`flex-1 flex flex-col bg-surface-light dark:bg-surface-dark h-full overflow-hidden ${mobileView === "list" ? "hidden lg:flex" : "flex"
          }`}
      >
        {/* Header toolbar */}
        <div className="bg-light-50 dark:bg-dark-900 px-3 py-2.5 lg:px-5 lg:py-3.5 flex items-center justify-between border-b border-border-light dark:border-border-dark shrink-0 z-10 overflow-hidden">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1 overflow-hidden">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 rounded-full hover:bg-light-150 dark:hover:bg-dark-800 transition-colors lg:hidden text-text-primary-light dark:text-text-primary-dark cursor-pointer shrink-0"
              title="Toggle Conversations"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Header avatar */}
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border border-[#E5E7EB] dark:border-[#333333] overflow-hidden shrink-0">
              {activeRoom?.cardImage && activeRoom.cardImage.startsWith("http") ? (
                <img src={activeRoom.cardImage} alt="" className=" object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <>
                  <img src={app_config.LogoIconLight} alt={app_config.name} className=" object-contain dark:hidden" />
                  <img src={app_config.LogoIconDark} alt={app_config.name} className=" object-contain hidden dark:block" />
                </>
              )}
            </div>

            <div className="min-w-0 flex-1 flex flex-col">
              <h3 className="text-[13px] lg:text-[15px] font-primary-semibold text-text-primary-light dark:text-text-primary-dark truncate leading-tight">
                {getActiveRoomTitle()}
              </h3>
              <p className="text-[11px] lg:text-[12px] font-primary-medium text-[#4B5563] dark:text-[#9CA3AF] truncate leading-tight">
                {getActiveRoomSubtitle()}
              </p>
            </div>
          </div>

          {/* Close / Reopen chat button */}
          {activeRoomId !== "zoho_support" && activeRoom && (
            <button
              onClick={isChatClosed ? handleReopenChat : handleEndChat}
              className="px-3 py-1.5 rounded-full text-[10px] lg:text-[11px] font-primary-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 select-none shrink-0 whitespace-nowrap ml-2"
              style={{
                borderColor: isChatClosed ? "var(--color-primary-500)" : "#E5E7EB",
                color: isChatClosed ? "var(--color-primary-500)" : "#6B7280",
                backgroundColor: isChatClosed ? "var(--color-primary-500-10, rgba(99,102,241,0.1))" : "transparent",
              }}
            >
              {isChatClosed ? "Reopen" : "End Chat"}
            </button>
          )}

          {activeRoomId === "zoho_support" && (
            <button
              onClick={() => setIsFallbackSupportModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full text-[11px] font-primary-bold border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer hover:scale-105 active:scale-95 select-none animate-fade-in"
            >
              Fix Zoho
            </button>
          )}
        </div>

        {/* Chat body */}
        {activeRoomId === "zoho_support" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6 overflow-y-auto bg-light-50/20 dark:bg-dark-900/10">
            <div className="w-20 h-20 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center animate-pulse">
              <HelpCircle className="w-10 h-10" />
            </div>
            <div className="max-w-md flex flex-col gap-2">
              <h4 className="text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                General Live Support Channel
              </h4>
              <p className="text-b2 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
                Live Support widget is launching. Please check the bottom right corner of your screen to communicate with our customer support agents.
              </p>
            </div>
          </div>
        ) : !isFirebaseReady ? (
          <MessagesSkeleton />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">

            {/* Ongoing Trade details banner (matching mobile top header) */}
            {activeRoom?.type === "trade" && (
              <div
                onClick={() => setIsTradeDetailsModalOpen(true)}
                className="px-3 py-2 md:px-5 md:py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between shrink-0 bg-light-50/50 dark:bg-dark-900/10 cursor-pointer hover:bg-light-100 dark:hover:bg-dark-800 transition-colors overflow-hidden gap-2"
              >
                <div className="flex-grow min-w-0 flex flex-col">
                  <span className="text-[13.5px] font-primary-bold text-text-primary-light dark:text-text-primary-dark truncate">
                    {activeRoom.cardName || "Gift Card"}
                  </span>
                  <span className="text-[11px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark truncate mt-0.5 animate-fade-in">
                    {tradeDetails?.total_amount
                      ? cleanAndFormat(tradeDetails.total_amount, "$")
                      : cleanAndFormat(activeRoom.cardAmount || "0", "$")}
                    {" ~ "}
                    {tradeDetails?.estimated
                      ? cleanAndFormat(tradeDetails.estimated, "₦")
                      : cleanAndFormat(activeRoom.settlementAmount || "0", "₦")}
                    {tradeDetails?.rate ? ` (@ ₦${Number(tradeDetails.rate).toLocaleString()})` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className="px-3 py-1 rounded-full text-[11px] font-primary-bold capitalize select-none"
                    style={{
                      color: getStatusColor(activeRoom.tradeStatus || "pending"),
                      backgroundColor: getStatusBgColor(activeRoom.tradeStatus || "pending"),
                    }}
                  >
                    {getStatusLabel(activeRoom.tradeStatus || "pending")}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                </div>
              </div>
            )}

            {/* Closed chat banner */}
            {isChatClosed && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 px-5 py-3 flex items-center justify-between shrink-0">
                <span className="text-[13px] font-primary-medium text-amber-700 dark:text-amber-400">This chat has been closed.</span>
                <button onClick={handleReopenChat} className="text-[12px] font-primary-bold text-primary-500 hover:underline cursor-pointer">Reopen</button>
              </div>
            )}

            {/* Messages scrolling view */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 md:p-6 flex flex-col gap-3 md:gap-4 scrollbar-thin scrollbar-thumb-light-200 dark:scrollbar-thumb-dark-800">
              {activeMessages.length === 0 && <MessagesSkeleton />}
              {activeMessages.map((msg) => {
                const isUser = msg.senderType === "user";
                const isSystem = msg.senderType === "system";

                // System message (centered pill)
                if (isSystem) {
                  return (
                    <div key={msg.id} className="self-center bg-light-100 dark:bg-dark-800/50 border border-border-light dark:border-border-dark px-4 py-2.5 rounded-2xl text-center max-w-[85%] shadow-xs">
                      <p className="text-[13px] font-primary-medium text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  );
                }

                // User message (right aligned, primary bubble)
                if (isUser) {
                  return (
                    <div key={msg.id} className="mb-1 flex flex-col gap-1.5 max-w-[80%] md:max-w-[70%] self-end items-end">
                      {msg.type === "image" && msg.imageUrl ? (
                        <div onClick={() => setActiveImagePreview(msg.imageUrl)} className="cursor-pointer">
                          <ChatImage src={msg.imageUrl} alt="sent image" />
                        </div>
                      ) : (
                        msg.text && (
                          <div className="bg-primary-500 text-white px-4 py-3 rounded-[20px] rounded-tr-none text-[14px] font-primary-medium leading-relaxed shadow-sm whitespace-pre-wrap break-words">
                            {msg.text}
                          </div>
                        )
                      )}
                      <div className="flex items-center gap-1.5 pr-1">
                        <span className="text-[10px] font-primary-medium text-text-tertiary-light dark:text-text-tertiary-dark">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        <span className="text-[10px] font-primary-bold text-text-secondary-light dark:text-text-secondary-dark">
                          {msg.senderName || "You"}
                        </span>
                        <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0 border border-primary-500/10">
                          <span className="text-[9px] text-primary-600 dark:text-primary-400 font-primary-bold uppercase">
                            {(msg.senderName || "U").charAt(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Agent message (left aligned, light bubble with Atex avatar)
                return (
                  <div key={msg.id} className="mb-1 flex flex-col gap-1.5 max-w-[85%] md:max-w-[70%] self-start items-start">
                    {/* Agent Avatar + Name header */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#333333] flex items-center justify-center shrink-0">
                        <img src={app_config.LogoIconLight} alt="support" className="w-4 h-4 object-contain dark:hidden" />
                        <img src={app_config.LogoIconDark} alt="support" className="w-4 h-4 object-contain hidden dark:block" />
                      </div>
                      <span className="text-[10px] font-primary-bold text-text-secondary-light dark:text-text-secondary-dark select-none">
                        {msg.senderName || `${app_config.name} customer support`}
                      </span>
                    </div>

                    {msg.type === "image" && msg.imageUrl ? (
                      <div className="ml-8 cursor-pointer" onClick={() => setActiveImagePreview(msg.imageUrl)}>
                        <ChatImage src={msg.imageUrl} alt="received image" />
                      </div>
                    ) : (
                      msg.text && (
                        <div className="ml-8 bg-light-100 dark:bg-dark-700/60 text-text-primary-light dark:text-text-primary-dark px-4 py-3 rounded-[20px] rounded-tl-none text-[14px] font-primary-medium leading-relaxed border border-border-light dark:border-border-dark/60 shadow-xs whitespace-pre-wrap break-words">
                          {msg.text}
                        </div>
                      )
                    )}
                    <span className="text-[10px] font-primary-medium text-text-tertiary-light dark:text-text-tertiary-dark ml-8">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment preview banner */}
            {filePreview && (
              <div className="bg-light-100 dark:bg-dark-800 p-3.5 border-t border-border-light dark:border-border-dark flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={filePreview}
                    alt="attachment upload preview"
                    className="w-12 h-12 object-cover rounded-xl border border-border-light dark:border-border-dark shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark truncate block">
                      {selectedFile?.name}
                    </span>
                    <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark block mt-0.5">
                      Image attached
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-500 hover:scale-105 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Message composer */}
            {isChatClosed ? (
              <div className="p-5 border-t border-border-light dark:border-border-dark flex items-center justify-center gap-3 shrink-0 bg-light-50 dark:bg-dark-900/10">
                <span className="text-[13px] font-primary-medium text-text-tertiary-light dark:text-text-tertiary-dark">Chat is closed.</span>
                <button onClick={handleReopenChat} className="text-[13px] font-primary-bold text-primary-500 hover:underline cursor-pointer">Reopen to send messages</button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="p-2.5 md:p-5 border-t border-border-light dark:border-border-dark flex items-center gap-2 md:gap-3 shrink-0 bg-light-50 dark:bg-dark-900/10">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 md:p-3 rounded-2xl bg-light-100 dark:bg-dark-800 hover:bg-light-150 dark:hover:bg-dark-700 transition-colors text-text-secondary-light dark:text-text-secondary-dark cursor-pointer shrink-0 border border-border-light/50 dark:border-border-dark/20"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={sending}
                    className="w-full bg-light-100 dark:bg-dark-800 border-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 py-3 px-3 md:px-4 rounded-[20px] text-b2 font-primary-regular text-text-primary-light dark:text-text-primary-dark placeholder:text-text-disabled-light dark:placeholder:text-text-disabled-dark transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center text-white bg-primary-500 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:opacity-80 transition-all"
                >
                  {sending ? (
                    <Loader2 className="w-5.5 h-5.5 animate-spin text-white" />
                  ) : (
                    <Send className="w-5.5 h-5.5 text-white" />
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* A. End Chat Confirmation Modal */}
      <CenterModal visible={isEndChatModalOpen} onClose={() => setIsEndChatModalOpen(false)} title="End Chat">
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            End this chat?
          </h4>
          <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-1.5 max-w-[280px]">
            Are you sure you want to end this chat session? You can reopen it at any time.
          </p>
          <div className="flex w-full gap-3 mt-6">
            <button
              onClick={confirmEndChat}
              className="flex-1 py-3.5 rounded-full border border-red-500 text-red-500 font-primary-bold text-[14px] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
            >
              Yes, end chat
            </button>
            <button
              onClick={() => setIsEndChatModalOpen(false)}
              className="flex-1 py-3.5 rounded-full bg-primary-500 text-white font-primary-bold text-[14px] hover:bg-primary-600 transition-all cursor-pointer"
            >
              No, keep open
            </button>
          </div>
        </div>
      </CenterModal>

      {/* B. Zoho Live Chat Fallback Options Modal */}
      <CenterModal visible={isFallbackSupportModalOpen} onClose={() => setIsFallbackSupportModalOpen(false)} title="General Support Options">
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h4 className="text-b1 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
            Connect to Support Agent
          </h4>
          <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-2.5">
            Our Zoho widget is launching. If you prefer, we can open a direct support room in our Firebase system to assist you.
          </p>
          <div className="flex flex-col w-full gap-3 mt-6">
            <Button
              onClick={handleCreateGeneralSupport}
              loading={isCreatingSupportRoom}
              className="w-full py-3.5 rounded-full bg-primary-500 text-white font-primary-bold text-[14px] cursor-pointer"
            >
              Open {app_config.name} Support Room
            </Button>
            <button
              onClick={() => setIsFallbackSupportModalOpen(false)}
              className="w-full py-3.5 rounded-full border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark font-primary-bold text-[14px] hover:bg-light-100 dark:hover:bg-dark-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </CenterModal>

      {/* C. Trade Details Modal (Click-to-view Drawer style) */}
      <CenterModal visible={isTradeDetailsModalOpen} onClose={() => setIsTradeDetailsModalOpen(false)} title="Trade Details">
        <div className="max-h-[60vh] overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden pr-1 select-none">
          {isFetchingTradeDetails ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">Fetching trade data...</span>
            </div>
          ) : !tradeDetails ? (
            <div className="py-10 text-center">
              <span className="text-b3 text-text-tertiary-light dark:text-text-tertiary-dark block">No specific trade details found.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {[
                { label: "Date", value: tradeDetails.plan_date || tradeDetails.date },
                { label: "Transaction ID", value: tradeDetails.transid, isCopyable: true },
                { label: "Category", value: tradeDetails.category },
                { label: "Sub Category", value: tradeDetails.subcategory },
                { label: "Gift Card Type", value: tradeDetails.physical_ecode },
                { label: "Country", value: tradeDetails.country },
                { label: "Total Value", value: tradeDetails.total_amount ? `$${Number(tradeDetails.total_amount).toLocaleString()}` : null },
                { label: "Amount Paid", value: tradeDetails.estimated ? `₦${Number(tradeDetails.estimated).toLocaleString()}` : null },
                { label: "Comments", value: tradeDetails.comment_ecode || tradeDetails.comment },
                { label: "Reject Reason", value: tradeDetails.reject_reason },
              ]
                .filter((row) => row.value !== undefined && row.value !== null && row.value !== "" && row.value !== "N/A")
                .map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3.5 border-b border-border-light/40 dark:border-border-dark/40 last:border-b-0">
                    <span className="text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark">{row.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-b3 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                        {String(row.value).length > 28 ? String(row.value).substring(0, 18) + "..." : row.value}
                      </span>
                      {row.isCopyable && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(row.value));
                            setCopiedField(row.label);
                            setTimeout(() => setCopiedField(null), 2000);
                          }}
                          className="p-1 rounded-lg hover:bg-light-150 dark:hover:bg-dark-800 text-[#9CA3AF] hover:text-[#4B5563]"
                        >
                          {copiedField === row.label ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

              {/* Gift Card Previews */}
              {tradeImages.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border-light/40 dark:border-border-dark/40">
                  <span className="text-[12px] font-primary-bold text-text-secondary-light dark:text-text-secondary-dark block mb-3.5">
                    Gift Card Previews ({tradeImages.length})
                  </span>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
                    {tradeImages.map((imgItem: any, idx: number) => {
                      const url = typeof imgItem === "string" ? imgItem : imgItem?.image;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveImagePreview(url);
                            setIsTradeDetailsModalOpen(false);
                          }}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-border-light/80 dark:border-border-dark/80 shrink-0 cursor-pointer hover:opacity-90"
                        >
                          <img src={url} alt="preview" className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CenterModal>

      {/* D. Full Screen Image Preview Modal */}
      <CenterModal visible={!!activeImagePreview} onClose={() => setActiveImagePreview(null)} title="Image Preview">
        <div className="flex items-center justify-center p-1 bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden">
          {activeImagePreview && (
            <img src={activeImagePreview} alt="Preview" className="max-h-[65vh] max-w-full object-contain rounded-xl" />
          )}
        </div>
      </CenterModal>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <React.Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    }>
      <MessagesContent />
    </React.Suspense>
  );
}

