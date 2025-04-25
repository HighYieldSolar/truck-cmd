import { 
  Truck, 
  FileText, 
  CheckCircle,
  CreditCard,
  Users,
  Briefcase
} from "lucide-react";

export const COMPLIANCE_TYPES = {
  REGISTRATION: {
    name: "Vehicle Registration",
    icon: <Truck size={18} className="text-blue-500" />,
    description: "Vehicle registration renewal",
    frequency: "Yearly"
  },
  INSPECTION: {
    name: "Vehicle Inspection",
    icon: <CheckCircle size={18} className="text-green-500" />,
    description: "DOT vehicle inspection",
    frequency: "Quarterly"
  },
  INSURANCE: {
    name: "Insurance",
    icon: <CreditCard size={18} className="text-purple-500" />,
    description: "Insurance policy renewal",
    frequency: "Yearly"
  },
  PERMIT: {
    name: "Permits",
    icon: <FileText size={18} className="text-orange-500" />,
    description: "Operating authority permits",
    frequency: "Varies"
  },
  LICENSE: {
    name: "Driver License",
    icon: <Users size={18} className="text-red-500" />,
    description: "CDL renewal",
    frequency: "Every 4 years"
  },
  MEDICAL: {
    name: "Medical Card",
    icon: <Briefcase size={18} className="text-pink-500" />,
    description: "DOT physical examination",
    frequency: "Every 2 years"
  },
  TAX: {
    name: "Tax Filing",
    icon: <FileText size={18} className="text-yellow-500" />,
    description: "Quarterly tax filing",
    frequency: "Quarterly"
  },
  IFTA: {
    name: "IFTA Filing",
    icon: <FileText size={18} className="text-indigo-500" />,
    description: "International Fuel Tax Agreement",
    frequency: "Quarterly"
  }
};