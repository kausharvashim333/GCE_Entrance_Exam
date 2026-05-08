const mongoose = require("mongoose");

const brandingSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: "branding", unique: true },
    instituteName: { type: String, default: "Genius Computer Education" },
    address: { type: String, default: "Opposite City Mall, Khargone" },
    certificateFooter: {
      type: String,
      default:
        "This certificate is awarded by Genius Computer Education to recognize the successful completion of the entrance examination.",
    },
    logoUrl: { type: String, default: "" },
    principalName: { type: String, default: "Principal" },
    signatureUrl: { type: String, default: "" },
    resultInstructions: {
      type: String,
      default:
        "This result is system-generated and valid without signature. For any discrepancies, contact the administration within 7 days.",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Branding", brandingSchema);
