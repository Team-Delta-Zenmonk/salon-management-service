const {
  colors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
} = require("./theme");

const styles = {
  // Page Body & Container
  body: {
    backgroundColor: colors.PAGE_BG,
    fontFamily: fonts.INTER,
    color: colors.DARK_TEXT,
    margin: 0,
    padding: "32px 12px",
    WebkitFontSmoothing: "antialiased",
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: colors.CARD_BG,
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: `0 2px 8px ${colors.SHADOW_COLOR}`,
    border: `1px solid ${colors.BORDER}`,
  },

  // Header Section
  logoSection: {
    padding: "24px 48px", // 24px vertical, 48px horizontal
    backgroundColor: colors.CARD_BG,
  },
  bannerSection: {
    backgroundColor: colors.PRIMARY_ORANGE,
    padding: "24px 48px",
  },
  bannerTitle: {
    fontSize: fontSizes.TITLE, // 24px
    lineHeight: lineHeights.TIGHT, // 130%
    color: colors.WHITE,
    fontFamily: fonts.INTER,
    fontStyle: "normal",
    fontWeight: fontWeights.BOLD,
    margin: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  headerBrandText: {
    color: colors.DARK_TEXT, // #121A26
    fontFamily: fonts.LORA,
    fontSize: fontSizes.BRAND, // 31px
    fontStyle: "normal",
    fontWeight: fontWeights.REGULAR,
    lineHeight: lineHeights.NORMAL,
    letterSpacing: "1px",
    display: "inline-block",
  },

  // Content Area
  contentSection: {
    padding: "32px 48px 36px 48px",
    backgroundColor: colors.CARD_BG,
  },
  greetingText: {
    color: colors.DARK_TEXT, // #121A26
    fontFamily: fonts.INTER,
    fontSize: fontSizes.XL, // 22px
    fontStyle: "normal",
    fontWeight: fontWeights.REGULAR,
    lineHeight: lineHeights.MEDIUM, // 140%
    margin: "0 0 12px 0",
  },
  bodyParagraph: {
    color: colors.BODY_TEXT, // #384860
    fontFamily: fonts.INTER,
    fontSize: fontSizes.MD, // 16px
    fontStyle: "normal",
    fontWeight: fontWeights.REGULAR,
    lineHeight: lineHeights.BODY, // 150%
    letterSpacing: "0.2px",
    margin: "0 0 24px 0",
  },
  secondaryParagraph: {
    color: colors.BODY_TEXT, // #384860
    fontFamily: fonts.INTER,
    fontSize: fontSizes.MD, // 16px
    fontStyle: "normal",
    fontWeight: fontWeights.REGULAR,
    lineHeight: lineHeights.BODY, // 150%
    letterSpacing: "0.2px",
    margin: 0,
  },

  // OTP Box Styles
  otpCard: {
    backgroundColor: colors.PEACH_BG,
    borderRadius: "8px",
    padding: "32px 24px 24px 24px",
    textAlign: "center",
    marginBottom: "28px",
  },
  otpDigits: {
    color: colors.DARK_TEXT,
    fontFamily: fonts.MONOSPACE,
    fontSize: fontSizes.OTP, // 38px
    fontStyle: "normal",
    fontWeight: fontWeights.BOLD,
    lineHeight: lineHeights.NORMAL,
    letterSpacing: "7px",
    margin: "0 0 10px 0",
    textAlign: "center",
  },
  otpExpiry: {
    color: colors.BODY_TEXT,
    fontFamily: fonts.INTER,
    fontSize: fontSizes.SM, // 14px
    fontStyle: "normal",
    fontWeight: fontWeights.REGULAR,
    margin: 0,
    textAlign: "center",
  },

  // Buttons
  primaryButton: {
    backgroundColor: colors.PRIMARY_ORANGE,
    color: colors.WHITE,
    borderRadius: "6px",
    fontSize: fontSizes.BASE, // 15px
    fontWeight: fontWeights.BOLD,
    textDecoration: "none",
    display: "inline-block",
    padding: "14px 32px",
    fontFamily: fonts.INTER,
    textAlign: "center",
  },

  // Salon Live / Success Badge
  successBadgeCard: {
    backgroundColor: colors.SUCCESS_BG,
    borderRadius: "6px",
    padding: "12px 16px",
    marginBottom: "24px",
  },
  successCheckCircle: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: colors.SUCCESS_GREEN,
    color: colors.WHITE,
    textAlign: "center",
    lineHeight: "22px",
    fontSize: "13px",
    fontWeight: fontWeights.BOLD,
  },
  badgeIconCell: {
    verticalAlign: "middle",
    paddingRight: "10px",
  },
  badgeTextCell: {
    verticalAlign: "middle",
  },
  successBadgeText: {
    color: colors.DARK_TEXT,
    fontFamily: fonts.INTER,
    fontSize: fontSizes.MD, // 16px
    fontStyle: "normal",
    fontWeight: fontWeights.BOLD,
    lineHeight: lineHeights.NORMAL,
  },

  // Button Sections
  buttonSection: {
    marginBottom: "24px",
  },
  buttonSectionLeft: {
    textAlign: "left",
    marginBottom: "24px",
  },
  buttonSectionSm: {
    marginBottom: "20px",
  },

  // Password Reset Box
  passwordResetCard: {
    backgroundColor: colors.SUCCESS_BG,
    borderRadius: "6px",
    padding: "14px 18px",
    marginBottom: "24px",
  },
  passwordResetTitle: {
    color: colors.SUCCESS_DARK_GREEN,
    fontSize: fontSizes.BASE, // 15px
    fontWeight: fontWeights.BOLD,
    margin: "0 0 4px 0",
  },
  passwordResetText: {
    color: colors.SUCCESS_TEXT,
    fontSize: "13px",
    margin: 0,
  },

  // Invoice Styles
  invoiceMetaCard: {
    backgroundColor: colors.MUTED_BG,
    borderRadius: "8px",
    border: `1px solid ${colors.BORDER}`,
    padding: "16px 20px",
    marginBottom: "24px",
  },
  invoiceMetaLabel: {
    fontSize: "11px",
    fontWeight: fontWeights.BOLD,
    color: colors.MUTED_TEXT,
    textTransform: "uppercase",
    margin: "0 0 4px 0",
  },
  invoiceMetaValue: {
    fontSize: fontSizes.BASE,
    fontWeight: fontWeights.BOLD,
    color: colors.DARK_TEXT,
    margin: 0,
  },
  invoiceStatusPaid: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: fontWeights.BOLD,
    backgroundColor: colors.PAID_BG,
    color: colors.PAID_TEXT,
  },
  invoiceStatusUnpaid: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: fontWeights.BOLD,
    backgroundColor: colors.UNPAID_BG,
    color: colors.UNPAID_TEXT,
  },

  // Lead Submission Styles
  leadCard: {
    border: `1px solid ${colors.BORDER}`,
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "24px",
    backgroundColor: colors.WHITE,
  },
  leadTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  leadLabelCell: {
    padding: "12px 16px",
    fontSize: fontSizes.SM,
    fontWeight: fontWeights.SEMIBOLD,
    color: colors.DARK_TEXT,
    width: "35%",
    verticalAlign: "top",
  },
  leadValueCell: {
    padding: "12px 16px",
    fontSize: fontSizes.SM,
    color: colors.BODY_TEXT,
    verticalAlign: "top",
  },

  // Divider
  divider: {
    borderColor: colors.BORDER,
    margin: 0,
  },

  // Footer Section
  footerSection: {
    padding: "24px 48px", // 24px vertical, 48px horizontal
    backgroundColor: colors.CARD_BG,
  },
  footerTitle: {
    color: colors.GREYSCALE_800, // #202B3C
    fontFamily: fonts.INTER,
    fontSize: fontSizes.SM, // 14px
    fontStyle: "normal",
    fontWeight: fontWeights.REGULAR,
    lineHeight: lineHeights.BODY, // 150%
    margin: 0,
    paddingBottom: "8px",
  },
  footerBody: {
    color: colors.GREYSCALE_500, // #65748A
    fontFamily: fonts.INTER,
    fontSize: fontSizes.XS, // 12px
    fontStyle: "normal",
    fontWeight: fontWeights.REGULAR,
    lineHeight: lineHeights.BODY, // 150%
    margin: 0,
  },
};

module.exports = styles;
