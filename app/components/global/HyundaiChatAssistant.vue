<template>
  <Teleport to="body">
    <div
      class="hyundai-chat"
      :class="{ 'is-open': isOpen, 'is-hidden': !isOpen && !isActionBarVisible }"
    >
      <Transition name="chat-panel">
        <section
          v-if="isOpen"
          class="chat-panel"
          aria-label="Hyundai assistant"
        >
          <header class="chat-header">
            <div class="chat-title">
              <span class="chat-mark" aria-hidden="true">
                <IconMessageCircle :size="18" stroke-width="2.2" />
              </span>
              <div>
                <h2>{{ dealerName }} Assistant</h2>
                <p>Sales, service, stock and directions</p>
              </div>
            </div>

            <div class="chat-header-actions">
              <button type="button" class="icon-button" aria-label="Reset chat" @click="resetChat">
                <IconRotateCcw :size="17" />
              </button>
              <button type="button" class="icon-button" aria-label="Close chat" @click="closeChat">
                <IconX :size="19" />
              </button>
            </div>
          </header>

          <div ref="messagesEl" class="chat-messages">
            <div v-if="messages.length === 0" class="chat-empty">
              <h3>What can I help with?</h3>
              <p>Ask about Hyundai stock, offers, test drives, service bookings or showroom details.</p>

              <div class="quick-actions" aria-label="Quick chat actions">
                <button
                  v-for="action in quickActions"
                  :key="action.id"
                  type="button"
                  class="quick-action"
                  @click="runQuickAction(action)"
                >
                  <component :is="action.icon" :size="18" stroke-width="2" />
                  <span>{{ action.label }}</span>
                </button>
              </div>
            </div>

            <template v-else>
              <article
                v-for="message in messages"
                :key="message.id"
                class="message-row"
                :class="{ 'from-user': message.role === 'user' }"
              >
                <div class="message-bubble">
                  <p>{{ message.text }}</p>

                  <div v-if="message.vehicles?.length" class="vehicle-suggestions">
                    <NuxtLink
                      v-for="vehicle in message.vehicles"
                      :key="vehicle.id"
                      :to="vehicle.href"
                      class="vehicle-suggestion"
                      @click="handleVehicleCardClick(vehicle)"
                    >
                      <span class="vehicle-suggestion-image">
                        <img
                          v-if="vehicle.image"
                          :src="vehicle.image"
                          :alt="vehicle.title"
                          loading="lazy"
                        />
                        <IconCar v-else :size="22" stroke-width="1.9" />
                      </span>
                      <span class="vehicle-suggestion-body">
                        <span class="vehicle-suggestion-title">{{ vehicle.title }}</span>
                        <span v-if="vehicle.meta" class="vehicle-suggestion-meta">{{ vehicle.meta }}</span>
                        <span class="vehicle-suggestion-price">{{ vehicle.price }}</span>
                      </span>
                      <IconChevronRight :size="16" stroke-width="2.4" />
                    </NuxtLink>
                  </div>

                  <div v-if="message.actions?.length" class="message-actions">
                    <button
                      v-for="action in message.actions"
                      :key="action.label"
                      type="button"
                      class="message-action"
                      :class="{ primary: action.primary }"
                      @click="handleAction(action)"
                    >
                      {{ action.label }}
                      <IconChevronRight :size="15" stroke-width="2.4" />
                    </button>
                  </div>
                </div>
              </article>

              <div v-if="isTyping" class="typing-row" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </div>
            </template>
          </div>

          <form class="chat-input-row" @submit.prevent="sendMessage">
            <input
              ref="inputEl"
              v-model="draft"
              type="text"
              autocomplete="off"
              :maxlength="MAX_MESSAGE_LENGTH"
              placeholder="Ask about stock, service, finance..."
              aria-label="Ask the Hyundai assistant"
            />
            <button type="submit" aria-label="Send message" :disabled="!draft.trim() || isTyping">
              <IconArrowUp :size="19" stroke-width="2.4" />
            </button>
          </form>
        </section>
      </Transition>

      <button
        v-if="!isOpen"
        type="button"
        class="chat-launcher"
        :class="{ 'is-nudging': isNudging }"
        aria-label="Open Hyundai assistant"
        @click="openChat"
      >
        <IconMessageCircle :size="24" stroke-width="2.3" />
        <span class="launcher-label">Chat</span>
        <span v-if="hasSavedConversation" class="conversation-badge" aria-label="Conversation saved">
          Saved
        </span>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ArrowUp as IconArrowUp,
  CalendarDays as IconCalendarDays,
  Car as IconCar,
  ChevronRight as IconChevronRight,
  CircleDollarSign as IconCircleDollarSign,
  MapPin as IconMapPin,
  MessageCircle as IconMessageCircle,
  RotateCcw as IconRotateCcw,
  Search as IconSearch,
  Wrench as IconWrench,
  X as IconX,
} from 'lucide-vue-next';

type ChatRole = 'assistant' | 'user';

interface ChatAction {
  label: string;
  to?: string;
  href?: string;
  primary?: boolean;
  intent?: string;
  lead?: boolean;
}

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  actions?: ChatAction[];
  vehicles?: ChatVehicleSummary[];
}

interface ChatVehicleSummary {
  id: string;
  title: string;
  price: string;
  stockId: string;
  href: string;
  image?: string;
  meta?: string;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: any;
}

type ChatResponse = {
  text: string;
  actions?: ChatAction[];
  vehicles?: ChatVehicleSummary[];
};

const CHAT_STORAGE_KEY = 'hyundai-chat-assistant-session-v1';
const CHAT_LEAD_CONTEXT_KEY = 'hyundai-chat-lead-context-v1';
const MAX_PERSISTED_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 500;
const MAX_LABEL_LENGTH = 80;
const CHAT_NUDGE_MIN_DELAY_MS = 14000;
const CHAT_NUDGE_MAX_DELAY_MS = 22000;
const CHAT_NUDGE_DURATION_MS = 900;

const mainStore = useMainStore();
const vehiclesStore = useVehiclesStore();
const route = useRoute();
const { gtag } = useGtag();

const isOpen = ref(false);
const isTyping = ref(false);
const isNudging = ref(false);
const draft = ref('');
const messages = ref<ChatMessage[]>([]);
const messagesEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);
let messageCounter = 0;
let previousBodyOverflow: string | null = null;
let mobileViewportQuery: MediaQueryList | null = null;
let chatNudgeTimer: number | null = null;
let chatNudgeResetTimer: number | null = null;

const quickActions: QuickAction[] = [
  { id: 'stock', label: 'Browse stock', prompt: 'What Hyundai vehicles are in stock?', icon: IconCar },
  { id: 'service', label: 'Book service', prompt: 'I need to book a Hyundai service', icon: IconWrench },
  { id: 'test-drive', label: 'Book a test drive', prompt: 'I would like to book a test drive', icon: IconCalendarDays },
  { id: 'offers', label: 'Current offers', prompt: 'Show me current Hyundai offers', icon: IconCircleDollarSign },
  { id: 'location', label: 'Find showroom', prompt: 'Where is the showroom?', icon: IconMapPin },
  { id: 'search', label: 'Help me choose', prompt: 'Help me choose a Hyundai model', icon: IconSearch },
];

const { siteName: dealerName } = useSiteIdentity();
const sitePhone = computed(() => mainStore.site?.phone || '(03) 5144 2133');
const cleanPhone = computed(() => sitePhone.value.replace(/[^\d+]/g, ''));
const showroomAddress = computed(() => mainStore.site?.showroom_address || mainStore.site?.departments?.sales?.address || '36/38 Foster St, Sale VIC 3850');
const directionsUrl = computed(() => mainStore.site?.map_directions || mainStore.site?.departments?.sales?.map_directions || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showroomAddress.value)}`);

const isVehiclePage = computed(() => String(route.name || '').startsWith('vehicle-for-sale'));
const isActionBarVisible = useMobileActionBarVisibility();
const hasSavedConversation = computed(() => !isOpen.value && messages.value.length > 0);

const openChat = async () => {
  stopChatNudge();
  isOpen.value = true;
  trackChatEvent('chat_opened');
  await nextTick();
  if (!isMobileChatViewport()) {
    inputEl.value?.focus();
  }
};

const closeChat = () => {
  isOpen.value = false;
};

const resetChat = () => {
  draft.value = '';
  isTyping.value = false;
  messages.value = [];
  if (import.meta.client) {
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
  }
  if (!isMobileChatViewport()) {
    nextTick(() => inputEl.value?.focus());
  }
};

const runQuickAction = (action: QuickAction) => {
  trackChatEvent('chat_quick_action_clicked', action.id);
  draft.value = action.prompt;
  sendMessage();
};

const sendMessage = async () => {
  const text = draft.value.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!text || isTyping.value) return;

  addMessage('user', text);
  trackChatEvent('chat_message_sent', classifyIntent(text));
  draft.value = '';
  isTyping.value = true;

  try {
    const response = await resolveResponse(text);
    addMessage('assistant', response.text, response.actions, response.vehicles);
    trackChatEvent('chat_response_shown', classifyIntent(text));
  } finally {
    isTyping.value = false;
  }
};

const resolveResponse = async (input: string): Promise<ChatResponse> => {
  await wait(450);
  const query = input.toLowerCase();

  if (containsAny(query, ['service', 'servicing', 'maintenance', 'repair', 'logbook'])) {
    return serviceResponse(query);
  }

  if (containsAny(query, ['test drive', 'drive', 'demo drive', 'try a car'])) {
    return {
      text: `We can help arrange a test drive at ${dealerName.value}. If you already know the model, include it in the booking notes and the team can confirm availability.`,
      actions: [
        { label: 'Book a test drive', to: withChatSource('/test-drive', 'test-drive'), primary: true, intent: 'test-drive', lead: true },
        { label: 'Browse Hyundai models', to: '/models' },
        { label: 'Call sales', href: `tel:${cleanPhone.value}`, intent: 'call-sales' },
      ],
    };
  }

  if (containsAny(query, ['offer', 'offers', 'special', 'deal', 'promotion', 'discount'])) {
    return {
      text: 'You can view current Hyundai offers and dealer specials online. For stock-specific pricing, the current vehicle listings are the best next step.',
      actions: [
        { label: 'View latest offers', to: '/special-offers', primary: true },
        { label: 'Browse current stock', to: '/car-sales' },
        { label: 'Ask for a quote', to: withChatSource('/contact', 'offers'), intent: 'offers', lead: true },
      ],
    };
  }

  if (containsAny(query, ['finance', 'repayment', 'payment', 'loan', 'quote'])) {
    return {
      text: `The ${dealerName.value} finance team can help with repayments, trade-ins and tailored quotes.`,
      actions: [
        { label: 'Finance enquiry', to: withChatSource('/finance', 'finance'), primary: true, intent: 'finance', lead: true },
        { label: 'Value my trade-in', to: '/sell-my-car' },
        { label: 'Call sales', href: `tel:${cleanPhone.value}`, intent: 'call-sales' },
      ],
    };
  }

  if (containsAny(query, ['address', 'where', 'location', 'directions', 'map', 'open', 'hours', 'trading'])) {
    return locationResponse(query);
  }

  if (containsAny(query, ['stock', 'available', 'inventory', 'car sales', 'used', 'demo', 'new', 'vehicle', 'vehicles', 'model', 'models', ...knownModels])) {
    return await stockResponse(query);
  }

  if (containsAny(query, ['hi', 'hello', 'hey']) || query.length < 4) {
    return {
      text: `Hi, I can help with Hyundai stock, offers, test drives, service bookings, finance and directions for ${dealerName.value}.`,
      actions: quickActions.slice(0, 4).map((action, index) => ({
        label: action.label,
        to: quickActionRoute(action.id),
        primary: index === 0,
        intent: action.id,
      })),
    };
  }

  return {
    text: 'I can help with Hyundai stock, offers, finance, service bookings, test drives and showroom details. Choose a path below or ask about a specific model such as Kona, Tucson, Santa Fe or IONIQ 5.',
    actions: [
      { label: 'Browse stock', to: '/car-sales', primary: true },
      { label: 'Book service', to: '/service' },
      { label: 'Contact the team', to: withChatSource('/contact', 'general'), intent: 'general', lead: true },
      { label: 'Call dealership', href: `tel:${cleanPhone.value}`, intent: 'call-sales' },
    ],
  };
};

const stockResponse = async (query: string): Promise<ChatResponse> => {
  await ensureVehiclesLoaded();

  const model = detectModel(query);
  const condition = detectCondition(query);
  const matches = vehiclesStore.vehicles.filter((vehicle: any) => {
    const vehicleText = vehicleTextIndex(vehicle);
    const matchesModel = model ? vehicleText.includes(model) : true;
    const matchesCondition = condition ? fieldValues(vehicle.condition).some(value => value.includes(condition)) : true;
    return matchesModel && matchesCondition;
  });

  if (model && matches.length > 0) {
    const label = titleCase(model.replace(/-/g, ' '));
    const featured = matches.slice(0, 2).map((vehicle: any) => vehicle.title).filter(Boolean);
    const vehicleSummaries = summarizeVehicles(matches.slice(0, 3));
    const firstStockId = vehicleSummaries[0]?.stockId;

    return {
      text: `I found ${matches.length} ${condition ? `${condition} ` : ''}${label} vehicle${matches.length === 1 ? '' : 's'} in current stock.${featured.length ? ` Examples include ${featured.join(' and ')}.` : ''}`,
      vehicles: vehicleSummaries,
      actions: [
        { label: `View ${label} stock`, to: `/car-sales/hyundai/${modelSlug(model)}`, primary: true },
        ...(firstStockId
          ? [{ label: 'Enquire about first match', to: withChatSource(`/car-sales?stock=${encodeURIComponent(firstStockId)}`, 'stock-enquiry'), intent: 'stock-enquiry', lead: true }]
          : []),
        { label: 'Book a test drive', to: withChatSource('/test-drive', 'test-drive'), intent: 'test-drive', lead: true },
      ],
    };
  }

  if (model) {
    const label = titleCase(model.replace(/-/g, ' '));
    return {
      text: `I could not see a matching ${label} in the loaded stock feed. The team can still confirm incoming vehicles and availability.`,
      actions: [
        { label: 'Request availability', to: withChatSource('/contact', 'stock-availability'), primary: true, intent: 'stock-availability', lead: true },
        { label: 'Browse all stock', to: '/car-sales' },
        { label: 'Call sales', href: `tel:${cleanPhone.value}`, intent: 'call-sales' },
      ],
    };
  }

  const hyundaiCount = vehiclesStore.vehicles.filter((vehicle: any) => vehicleTextIndex(vehicle).includes('hyundai')).length;
  const total = vehiclesStore.vehicleCount || vehiclesStore.vehicles.length;

  return {
    text: `There are ${total} vehicles in current stock${hyundaiCount ? `, including ${hyundaiCount} Hyundai vehicle${hyundaiCount === 1 ? '' : 's'}` : ''}. You can filter by model, condition, budget and body style on the stock page.`,
    vehicles: summarizeVehicles(vehiclesStore.vehicles.filter((vehicle: any) => vehicleTextIndex(vehicle).includes('hyundai')).slice(0, 3)),
    actions: [
      { label: 'Browse current stock', to: '/car-sales', primary: true },
      { label: 'Explore Hyundai models', to: '/models' },
      { label: 'Request help choosing', to: withChatSource('/contact', 'stock-help'), intent: 'stock-help', lead: true },
    ],
  };
};

const serviceResponse = (query: string) => {
  const servicePhone = mainStore.site?.departments?.service?.phone || sitePhone.value;
  const serviceHours = formatTradingHours(mainStore.site?.departments?.service?.trading);
  const talksParts = containsAny(query, ['parts', 'accessories']);

  return {
    text: talksParts
      ? `For Hyundai parts and accessories, ${dealerName.value} can help confirm fitment and availability. ${serviceHours ? `Service and parts hours: ${serviceHours}` : ''}`
      : `You can book Hyundai servicing online or call the service team on ${servicePhone}. ${serviceHours ? `Service hours: ${serviceHours}` : ''}`,
    actions: [
      { label: talksParts ? 'Parts enquiry' : 'Book service', to: withChatSource(talksParts ? '/parts' : '/service', talksParts ? 'parts' : 'service'), primary: true, intent: talksParts ? 'parts' : 'service', lead: true },
      { label: 'Call service', href: `tel:${servicePhone.replace(/[^\d+]/g, '')}` },
      { label: 'Get directions', href: directionsUrl.value },
    ],
  };
};

const locationResponse = (query: string) => {
  const hours = formatTradingHours(mainStore.site?.departments?.sales?.trading || mainStore.site?.trading_hours);
  const asksHours = containsAny(query, ['hours', 'open', 'trading', 'time']);

  return {
    text: asksHours
      ? `${dealerName.value} sales hours: ${hours || 'Please call us for current trading hours.'}`
      : `${dealerName.value} is located at ${showroomAddress.value}. You can call the team on ${sitePhone.value}.`,
    actions: [
      { label: 'Get directions', href: directionsUrl.value, primary: true },
      { label: 'Call dealership', href: `tel:${cleanPhone.value}` },
      { label: 'Contact us', to: withChatSource('/contact', 'location'), intent: 'location', lead: true },
    ],
  };
};

const addMessage = (role: ChatRole, text: string, actions?: ChatAction[], vehicles?: ChatVehicleSummary[]) => {
  messages.value.push({
    id: `chat-${Date.now()}-${messageCounter++}`,
    role,
    text,
    actions,
    vehicles,
  });
  nextTick(scrollToBottom);
};

const scrollToBottom = () => {
  if (!messagesEl.value) return;
  messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
};

const handleAction = (action: ChatAction) => {
  trackChatEvent('chat_action_clicked', action.intent || action.label);
  const safeTo = safeInternalPath(action.to);
  const safeHref = safeActionHref(action.href);

  if (action.lead) {
    storeLeadContext(action.intent || action.label, safeTo || safeHref || '');
    trackChatEvent('chat_lead_handoff', action.intent || action.label);
  }

  if (safeHref?.startsWith('tel:')) {
    trackChatEvent('chat_human_handoff', action.intent || 'phone');
  }

  if (safeHref) {
    window.location.href = safeHref;
    return;
  }

  if (safeTo) {
    navigateTo(safeTo);
    closeChat();
  }
};

const handleVehicleCardClick = (vehicle: ChatVehicleSummary) => {
  trackChatEvent('chat_vehicle_card_clicked', vehicle.stockId);
  if (isMobileChatViewport()) {
    closeChat();
  }
};

const ensureVehiclesLoaded = async () => {
  if (vehiclesStore.isDataLoaded || vehiclesStore.vehicles.length > 0) return;
  await vehiclesStore.fetchVehicles();
};

const summarizeVehicles = (vehicles: any[]): ChatVehicleSummary[] => {
  return vehicles
    .map((vehicle) => {
      const stockId = String(vehicle.stockid || vehicle.identifier || vehicle.id || '');
      if (!stockId) return null;

      return {
        id: stockId,
        title: getVehicleTitle(vehicle),
        price: getVehiclePrice(vehicle),
        stockId,
        href: getVehicleHref(vehicle),
        image: getVehicleImage(vehicle),
        meta: getVehicleMeta(vehicle),
      };
    })
    .filter(Boolean) as ChatVehicleSummary[];
};

const getVehicleTitle = (vehicle: any) => {
  return String(vehicle.title || [
    firstFieldValue(vehicle.year),
    firstFieldValue(vehicle.make),
    firstFieldValue(vehicle.model),
    firstFieldValue(vehicle.badge),
  ].filter(Boolean).join(' ') || 'Hyundai vehicle');
};

const getVehiclePrice = (vehicle: any) => {
  const rawPrice = typeof vehicle.price === 'object' && vehicle.price !== null ? vehicle.price.value : vehicle.price;
  const price = typeof rawPrice === 'string' ? Number.parseFloat(rawPrice) : rawPrice;
  if (!price || Number.isNaN(price)) return 'POA';
  return `$${Number(price).toLocaleString()}`;
};

const getVehicleHref = (vehicle: any) => {
  const stockId = encodeURIComponent(String(vehicle.stockid || vehicle.identifier || vehicle.id || ''));
  const slug = slugify(String(vehicle.slug || getVehicleTitle(vehicle)));
  return `/vehicle-for-sale/${stockId}/${slug}`;
};

const getVehicleImage = (vehicle: any) => {
  const image = vehicle.images?.[0] || vehicle.thumb || vehicle.main_photo_url || vehicle.photos?.[0];
  if (!image) return '';
  if (typeof image === 'string') return safeImageUrl(image);
  return safeImageUrl(image.url || image.src || '');
};

const getVehicleMeta = (vehicle: any) => {
  const condition = firstFieldValue(vehicle.condition);
  const kms = vehicle.kms || vehicle.odometer?.value?.[0] || vehicle.odometer?.displayValue?.[0] || vehicle.odometer;
  const kmsLabel = formatKilometres(kms);
  return [condition, kmsLabel, `Stock #${vehicle.stockid || vehicle.identifier || vehicle.id}`].filter(Boolean).join(' | ');
};

const firstFieldValue = (field: any) => {
  if (!field) return '';
  if (Array.isArray(field.displayValue) && field.displayValue[0]) return String(field.displayValue[0]);
  if (Array.isArray(field.value) && field.value[0]) return String(field.value[0]);
  if (typeof field === 'string' || typeof field === 'number') return String(field);
  return '';
};

const boundedText = (value: unknown, maxLength = MAX_MESSAGE_LENGTH) => String(value || '').slice(0, maxLength);

const safeInternalPath = (value?: string) => {
  if (!value || typeof value !== 'string') return '';
  if (!value.startsWith('/') || value.startsWith('//')) return '';
  return value.slice(0, 500);
};

const safeActionHref = (value?: string) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim().slice(0, 1000);
  if (trimmed.startsWith('tel:')) return /^tel:\+?[\d\s().-]+$/.test(trimmed) ? trimmed : '';

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
  } catch {
    return '';
  }

  return '';
};

const safeImageUrl = (value: unknown) => {
  const raw = String(value || '').trim().slice(0, 1200);
  if (!raw) return '';
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
  } catch {
    return '';
  }

  return '';
};

const sanitizeStoredAction = (action: any): ChatAction | null => {
  if (!action || typeof action !== 'object') return null;
  const label = boundedText(action.label, MAX_LABEL_LENGTH);
  if (!label) return null;

  const to = safeInternalPath(action.to);
  const href = safeActionHref(action.href);
  if (action.to && !to) return null;
  if (action.href && !href) return null;

  return {
    label,
    ...(to ? { to } : {}),
    ...(href ? { href } : {}),
    primary: Boolean(action.primary),
    intent: boundedText(action.intent, MAX_LABEL_LENGTH),
    lead: Boolean(action.lead),
  };
};

const sanitizeStoredVehicle = (vehicle: any): ChatVehicleSummary | null => {
  if (!vehicle || typeof vehicle !== 'object') return null;
  const stockId = boundedText(vehicle.stockId || vehicle.id, MAX_LABEL_LENGTH);
  const href = safeInternalPath(vehicle.href);
  if (!stockId || !href) return null;

  return {
    id: stockId,
    title: boundedText(vehicle.title, 120) || 'Hyundai vehicle',
    price: boundedText(vehicle.price, 40) || 'POA',
    stockId,
    href,
    image: safeImageUrl(vehicle.image),
    meta: boundedText(vehicle.meta, 160),
  };
};

const sanitizeStoredMessage = (message: any): ChatMessage | null => {
  if (!message || typeof message !== 'object') return null;
  if (message.role !== 'assistant' && message.role !== 'user') return null;

  const text = boundedText(message.text);
  if (!text) return null;

  return {
    id: boundedText(message.id, MAX_LABEL_LENGTH) || `restored-${Date.now()}-${messageCounter++}`,
    role: message.role,
    text,
    actions: Array.isArray(message.actions)
      ? message.actions.map(sanitizeStoredAction).filter(Boolean) as ChatAction[]
      : undefined,
    vehicles: Array.isArray(message.vehicles)
      ? message.vehicles.map(sanitizeStoredVehicle).filter(Boolean) as ChatVehicleSummary[]
      : undefined,
  };
};

const formatKilometres = (value: any) => {
  if (value === 0) return '0 km';
  if (!value) return '';
  const kilometres = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/,/g, ''));
  if (Number.isNaN(kilometres)) return '';
  return `${kilometres.toLocaleString()} km`;
};

const withChatSource = (path: string, intent: string) => {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}source=chat&intent=${encodeURIComponent(intent)}&chat_source=chat&chat_intent=${encodeURIComponent(intent)}`;
};

const storeLeadContext = (intent: string, destination: string) => {
  if (!import.meta.client) return;

  const lastUserMessage = [...messages.value].reverse().find(message => message.role === 'user')?.text || '';
  const lastAssistantMessage = [...messages.value].reverse().find(message => message.role === 'assistant')?.text || '';
  const vehicles = [...messages.value]
    .reverse()
    .find(message => message.vehicles?.length)
    ?.vehicles?.slice(0, 3) || [];

  sessionStorage.setItem(CHAT_LEAD_CONTEXT_KEY, JSON.stringify({
    intent,
    destination,
    currentRoute: route.fullPath,
    lastUserMessage,
    lastAssistantMessage,
    vehicles,
    createdAt: new Date().toISOString(),
  }));
};

const persistChatSession = () => {
  if (!import.meta.client) return;

  if (!messages.value.length) {
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
    messages: messages.value.slice(-MAX_PERSISTED_MESSAGES),
    savedAt: Date.now(),
  }));
};

const restoreChatSession = () => {
  if (!import.meta.client) return;

  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.messages)) return;

    messages.value = parsed.messages
      .map(sanitizeStoredMessage)
      .filter(Boolean)
      .slice(-MAX_PERSISTED_MESSAGES) as ChatMessage[];

    if (messages.value.length) {
      messageCounter = messages.value.length;
      trackChatEvent('chat_session_restored', String(messages.value.length));
    }
  } catch {
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
  }
};

const quickActionRoute = (id: string) => {
  const routes: Record<string, string> = {
    stock: '/car-sales',
    service: '/service',
    'test-drive': '/test-drive',
    offers: '/special-offers',
    location: '/contact',
    search: '/models',
  };
  return routes[id] || '/contact';
};

const containsAny = (text: string, terms: string[]) => terms.some(term => text.includes(term));

const knownModels = [
  'accent',
  'elantra',
  'exlexio',
  'ioniq',
  'ioniq 5',
  'ioniq 6',
  'i30',
  'kona',
  'palisade',
  'santa fe',
  'santafe',
  'sonata',
  'staria',
  'tucson',
  'venue',
];

const detectModel = (query: string) => {
  const normalized = query.replace(/\s+/g, ' ');
  const found = knownModels.find(model => normalized.includes(model));
  if (!found) return '';
  if (found === 'santafe') return 'santa fe';
  if (found === 'ioniq') {
    if (normalized.includes('ioniq 5')) return 'ioniq 5';
    if (normalized.includes('ioniq 6')) return 'ioniq 6';
  }
  return found;
};

const detectCondition = (query: string) => {
  if (query.includes('demo')) return 'demo';
  if (query.includes('used') || query.includes('pre owned') || query.includes('pre-owned')) return 'used';
  if (query.includes('new')) return 'new';
  return '';
};

const vehicleTextIndex = (vehicle: any) => [
  vehicle.title,
  ...fieldValues(vehicle.make),
  ...fieldValues(vehicle.model),
  ...fieldValues(vehicle.badge),
  ...fieldValues(vehicle.condition),
].filter(Boolean).join(' ').toLowerCase();

const fieldValues = (field: any): string[] => {
  if (!field) return [];
  const values = [
    ...(Array.isArray(field.value) ? field.value : []),
    ...(Array.isArray(field.displayValue) ? field.displayValue : []),
    ...(Array.isArray(field.displayMake) ? field.displayMake.flatMap((make: any) => make?.displayValue || []) : []),
  ];
  return values.map(value => String(value).toLowerCase());
};

const formatTradingHours = (hours: any) => {
  if (!hours) return '';
  if (typeof hours === 'string') return hours;
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const lines = days.map((day) => {
    const entry = Array.isArray(hours[day]) ? hours[day][0] : hours[day];
    if (!entry) return '';
    const label = titleCase(day);
    if (entry.open && entry.close) return `${label} ${entry.open} to ${entry.close}`;
    return `${label} closed`;
  }).filter(Boolean);
  return lines.slice(0, 7).join(', ');
};

const titleCase = (value: string) => value.replace(/\b\w/g, char => char.toUpperCase());
const modelSlug = (value: string) => value.toLowerCase().replace(/\s+/g, '-');
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const classifyIntent = (input: string) => {
  const query = input.toLowerCase();
  if (containsAny(query, ['service', 'servicing', 'maintenance', 'repair', 'logbook'])) return 'service';
  if (containsAny(query, ['test drive', 'drive', 'demo drive', 'try a car'])) return 'test-drive';
  if (containsAny(query, ['offer', 'offers', 'special', 'deal', 'promotion', 'discount'])) return 'offers';
  if (containsAny(query, ['finance', 'repayment', 'payment', 'loan', 'quote'])) return 'finance';
  if (containsAny(query, ['address', 'where', 'location', 'directions', 'map', 'open', 'hours', 'trading'])) return 'location';
  if (containsAny(query, ['stock', 'available', 'inventory', 'car sales', 'used', 'demo', 'new', 'vehicle', 'vehicles', 'model', 'models', ...knownModels])) return 'stock';
  return 'general';
};

const trackChatEvent = (event: string, label = '') => {
  if (!import.meta.client) return;

  const payload = {
    event,
    event_category: 'engagement',
    event_label: label || (isVehiclePage.value ? 'vehicle_page' : 'sitewide'),
    chat_intent: label || 'general',
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  if (typeof gtag === 'function') {
    gtag('event', event, payload);
  }
};

const isMobileChatViewport = () => {
  if (!import.meta.client) return false;
  return window.matchMedia('(max-width: 640px)').matches;
};

const shouldRunChatNudge = () => {
  if (!import.meta.client || isOpen.value || !isActionBarVisible.value) return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const clearChatNudgeTimers = () => {
  if (chatNudgeTimer !== null) {
    window.clearTimeout(chatNudgeTimer);
    chatNudgeTimer = null;
  }

  if (chatNudgeResetTimer !== null) {
    window.clearTimeout(chatNudgeResetTimer);
    chatNudgeResetTimer = null;
  }
};

const stopChatNudge = () => {
  clearChatNudgeTimers();
  isNudging.value = false;
};

const scheduleChatNudge = () => {
  clearChatNudgeTimers();
  isNudging.value = false;

  if (!shouldRunChatNudge()) return;

  const delay = CHAT_NUDGE_MIN_DELAY_MS + Math.random() * (CHAT_NUDGE_MAX_DELAY_MS - CHAT_NUDGE_MIN_DELAY_MS);
  chatNudgeTimer = window.setTimeout(() => {
    if (!shouldRunChatNudge()) return;

    isNudging.value = true;
    chatNudgeResetTimer = window.setTimeout(() => {
      isNudging.value = false;
      scheduleChatNudge();
    }, CHAT_NUDGE_DURATION_MS);
  }, delay);
};

const syncBodyScrollLock = () => {
  if (!import.meta.client) return;

  if (isOpen.value && isMobileChatViewport()) {
    if (previousBodyOverflow === null) {
      previousBodyOverflow = document.body.style.overflow;
    }
    document.body.style.overflow = 'hidden';
    return;
  }

  unlockBodyScroll();
};

const unlockBodyScroll = () => {
  if (!import.meta.client || previousBodyOverflow === null) return;
  document.body.style.overflow = previousBodyOverflow;
  previousBodyOverflow = null;
};

watch(isOpen, () => {
  nextTick(syncBodyScrollLock);
  scheduleChatNudge();
});

watch(isActionBarVisible, scheduleChatNudge);

watch(messages, persistChatSession, { deep: true });

onMounted(() => {
  restoreChatSession();
  mobileViewportQuery = window.matchMedia('(max-width: 640px)');
  mobileViewportQuery.addEventListener('change', syncBodyScrollLock);
  scheduleChatNudge();
});

onUnmounted(() => {
  stopChatNudge();
  unlockBodyScroll();
  mobileViewportQuery?.removeEventListener('change', syncBodyScrollLock);
  mobileViewportQuery = null;
});
</script>

<style scoped lang="scss">
.hyundai-chat {
  position: fixed;
  right: 20px;
  bottom: 86px;
  z-index: 950;
  font-family: var(--font-family-base);
}

.chat-launcher {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 52px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 14px 34px rgba(0, 30, 80, 0.28);
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.chat-launcher:hover,
.chat-launcher:focus-visible {
  background: #002c5f;
  transform: translateY(-2px);
  box-shadow: 0 16px 38px rgba(0, 30, 80, 0.34);
  outline: none;
}

.chat-launcher.is-nudging {
  animation: chatLauncherNudge 880ms ease-in-out;
}

.chat-launcher.is-nudging svg {
  animation: chatLauncherIconNudge 760ms ease-in-out;
}

.launcher-label {
  font-size: 14px;
  line-height: 1;
}

.conversation-badge {
  position: absolute;
  top: -7px;
  right: 8px;
  min-width: 34px;
  padding: 2px 6px;
  border: 1px solid #fff;
  border-radius: 999px;
  background: #00aad2;
  color: #fff;
  box-shadow: 0 6px 14px rgba(0, 30, 80, 0.18);
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
  pointer-events: none;
}

.chat-panel {
  width: min(392px, calc(100vw - 32px));
  max-height: min(680px, calc(100vh - 112px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.24);
}

.chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #e6eaf0;
  background: #fff;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.chat-mark {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
}

.chat-title h2 {
  margin: 0;
  color: var(--color-primary);
  font-family: var(--font-family-head);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.chat-title p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.3;
}

.chat-header-actions {
  display: flex;
  gap: 4px;
}

.icon-button {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.icon-button:hover,
.icon-button:focus-visible {
  background: #f1f5f9;
  color: var(--color-primary);
  outline: none;
}

.chat-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 16px;
  background: #f8fafc;
}

.chat-empty h3 {
  margin: 0;
  color: #111827;
  font-family: var(--font-family-head);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
}

.chat-empty p {
  margin: 8px 0 18px;
  color: #475569;
  font-size: 14px;
  line-height: 1.45;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 9px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  min-height: 48px;
  padding: 11px 13px;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  background: #fff;
  color: #14213d;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
}

.quick-action svg {
  color: var(--color-primary-light);
  flex: 0 0 auto;
}

.quick-action:hover,
.quick-action:focus-visible {
  border-color: var(--color-primary-light);
  background: #f3fbfd;
  color: var(--color-primary);
  outline: none;
}

.message-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}

.message-row.from-user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 86%;
  padding: 11px 13px;
  border-radius: 8px;
  background: #fff;
  color: #172033;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.from-user .message-bubble {
  background: var(--color-primary);
  color: #fff;
}

.message-bubble p {
  margin: 0;
  white-space: pre-line;
  font-size: 14px;
  line-height: 1.45;
}

.vehicle-suggestions {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.vehicle-suggestion {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 72px;
  padding: 7px 8px 7px 7px;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  background: #fff;
  color: #172033;
  text-decoration: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.vehicle-suggestion:hover,
.vehicle-suggestion:focus-visible {
  border-color: var(--color-primary-light);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
  outline: none;
  transform: translateY(-1px);
}

.vehicle-suggestion-image {
  width: 64px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6px;
  background: #eef3f8;
  color: var(--color-primary);
}

.vehicle-suggestion-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vehicle-suggestion-body {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.vehicle-suggestion-title {
  overflow: hidden;
  color: #111827;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vehicle-suggestion-meta {
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vehicle-suggestion-price {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
}

.message-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.message-action {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid #d8e1ea;
  border-radius: 6px;
  background: #fff;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.message-action.primary {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}

.message-action:hover,
.message-action:focus-visible {
  border-color: var(--color-primary-light);
  outline: none;
}

.typing-row {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  min-height: 34px;
  padding: 11px 13px;
  border-radius: 8px;
  background: #fff;
}

.typing-row span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #94a3b8;
  animation: chatTyping 900ms infinite ease-in-out;
}

.typing-row span:nth-child(2) {
  animation-delay: 110ms;
}

.typing-row span:nth-child(3) {
  animation-delay: 220ms;
}

.chat-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e6eaf0;
  background: #fff;
}

.chat-input-row input {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #d8e1ea;
  border-radius: 8px;
  background: #f8fafc;
  color: #111827;
  font: inherit;
  font-size: 14px;
}

.chat-input-row input:focus {
  border-color: var(--color-primary-light);
  background: #fff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 170, 210, 0.16);
}

.chat-input-row button {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
}

.chat-input-row button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chat-panel-enter-active,
.chat-panel-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@keyframes chatTyping {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.55;
  }
  50% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

@keyframes chatLauncherNudge {
  0%,
  100% {
    transform: translateX(0) rotate(0deg);
  }
  15% {
    transform: translateX(-2px) rotate(-1.8deg);
  }
  30% {
    transform: translateX(2px) rotate(1.8deg);
  }
  45% {
    transform: translateX(-1px) rotate(-1deg);
  }
  60% {
    transform: translateX(1px) rotate(1deg);
  }
  75% {
    transform: translateX(0) rotate(0deg) scale(1.03);
  }
}

@keyframes chatLauncherIconNudge {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.08) rotate(-5deg);
  }
  50% {
    transform: scale(0.96) rotate(5deg);
  }
  75% {
    transform: scale(1.04) rotate(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-launcher.is-nudging,
  .chat-launcher.is-nudging svg {
    animation: none;
  }
}

@media (min-width: 960px) {
  .hyundai-chat {
    bottom: 24px;
  }

  .chat-panel {
    max-height: min(680px, calc(100vh - 48px));
  }
}

@media (max-width: 959px) {
  .hyundai-chat {
    right: 0;
    bottom: 0;
    width: 25vw;
    height: calc(64px + env(safe-area-inset-bottom));
    transform: translateY(0);
    transition: transform 220ms ease;
    will-change: transform;
  }

  .hyundai-chat.is-hidden {
    pointer-events: none;
    transform: translateY(100%);
  }

  .chat-launcher {
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
    border-left: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 0;
    box-shadow: 0 -8px 24px rgba(0, 30, 80, 0.22);
    font-size: 0.72rem;
  }

  .chat-launcher:hover,
  .chat-launcher:focus-visible {
    transform: none;
    box-shadow: 0 -8px 24px rgba(0, 30, 80, 0.22);
  }

  .chat-launcher svg {
    width: 21px;
    height: 21px;
  }

  .launcher-label {
    font-size: 0.72rem;
  }

  .conversation-badge {
    top: 5px;
    right: 5px;
    min-width: 31px;
    padding: 1px 5px;
    font-size: 9px;
  }
}

@media (max-width: 520px) {
  .hyundai-chat {
    left: auto;
  }

  .chat-launcher {
    margin-left: 0;
  }

  .chat-panel {
    width: 100%;
    max-height: calc(100vh - 116px);
  }
}

@media (max-width: 359px) {
  .chat-launcher {
    font-size: 0.66rem;
  }

  .chat-launcher svg {
    width: 19px;
    height: 19px;
  }

  .launcher-label {
    font-size: 0.66rem;
  }
}

@media (max-width: 640px) {
  .hyundai-chat.is-open {
    inset: auto 0 0 0;
    bottom: 0;
    width: auto;
    height: auto;
  }

  .chat-panel {
    width: 100vw;
    height: calc(100dvh - 12px);
    max-height: none;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -18px 48px rgba(15, 23, 42, 0.22);
  }

  .chat-messages {
    overscroll-behavior: contain;
    padding-bottom: 16px;
  }

  .message-bubble {
    max-width: 92%;
  }

  .chat-input-row {
    padding-bottom: max(12px, env(safe-area-inset-bottom));
  }
}
</style>
