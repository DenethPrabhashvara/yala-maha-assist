import {
  ArrowRight, Bell, CircleCheck, CloudSun, Inbox, OctagonAlert, Camera, Carrot, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock, Cloud,
  CloudRain, Construction, Droplet, Droplets, Ellipsis, Fence, Globe, House, Info, Leaf, LocateFixed, Lock, LogOut,
  Map, MapPin, MessageSquareText, Mic, Plus, RefreshCw, Search, Send, Sparkles, SquarePen, Sun,
  Trash2, TriangleAlert, User, Waves, WifiOff, X,
} from 'lucide-react';

// App icon names → Lucide, a standard open-source set close to SF Symbols' outline style.
// (SF Symbols themselves are licensed for Apple-platform apps only, so they can't ship on the web.)
const P = {
  leaf: Leaf,
  bell: Bell,
  warn: TriangleAlert,
  arrow: ArrowRight,
  back: ChevronLeft,
  close: X,
  chevron: ChevronRight,
  down: ChevronDown,
  pin: MapPin,
  drop: Droplet,
  home: House,
  plus: Plus,
  map: Map,
  user: User,
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  spark: Sparkles,
  sms: MessageSquareText,
  check: Check,
  blockage: Construction,
  leak: Droplets,
  gate: Fence,
  dots: Ellipsis,
  camera: Camera,
  mic: Mic,
  send: Send,
  trash: Trash2,
  pencil: SquarePen,
  lock: Lock,
  search: Search,
  info: Info,
  clock: Clock,
  target: LocateFixed,
  refresh: RefreshCw,
  globe: Globe,
  help: CircleHelp,
  logout: LogOut,
  wifiOff: WifiOff,
  tank: Waves,
  chilli: Carrot,
  cloudSun: CloudSun,
  checkCircle: CircleCheck,
  stop: OctagonAlert,
  inbox: Inbox,
};

export default function Icon({ name, size = 20, color = 'currentColor', stroke = 2, style, className }) {
  const Glyph = P[name] || Ellipsis;
  return <Glyph size={size} color={color} strokeWidth={stroke} aria-hidden="true" style={style} className={className} />;
}
