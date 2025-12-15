import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  /* MAIN CONTAINER */
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F8F9FA",
  },

  /* TOP NAV / HEADER */
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 4,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },

  navText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  /* PAGE TITLE */
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  /* TITLE ROW WITH CART NUMBER */
titleRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
},

cartNumberContainer: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
},

cartNumberInput: {
  width: 55,
  height: 40,
  borderWidth: 2,
  borderColor: "#2563EB",
  borderRadius: 8,
  textAlign: "center",
  fontSize: 15,
  fontWeight: "600",
  backgroundColor: "#FFFFFF",
  color: "#1E293B",
},

cartNumberButton: {
  backgroundColor: "#10B981",
  width: 40,
  height: 40,
  borderRadius: 8,
  justifyContent: "center",
  alignItems: "center",
  elevation: 2,
},

cartNumberButtonText: {
  color: "#FFFFFF",
  fontSize: 18,
  fontWeight: "700",
},

savedCartText: {
  fontSize: 14,
  color: "#10B981",
  fontWeight: "600",
  marginBottom: 12,
},
  /* FORM INPUT */
  form: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 10,
  },

  input: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#1E293B",
  },

  addButton: {
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },

  addText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  infoText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
    fontStyle: "italic",
  },

  /* PRODUCT ITEM CARD */
  productItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  productInfo: {
    flex: 1,
  },

  productName: {
  fontSize: 20,  // UBAH dari 18 ke 20
  fontWeight: "700",
  color: "#1E293B",
  marginBottom: 4,
  },

productId: {
  fontSize: 12,
  color: "#94A3B8",
  marginBottom: 6,
  },

productPrice: {
  fontSize: 19,  // UBAH dari 17 ke 19
  fontWeight: "600",
  color: "#2563EB",
  marginBottom: 12,
  },

  /* QTY ROW */
  /* QTY + DELETE ROW */
qtyDeleteRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 4,
},

qtyControls: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},

qtyButton: {
  backgroundColor: "#2563EB",
  width: 36,
  height: 36,
  borderRadius: 8,
  justifyContent: "center",
  alignItems: "center",
  elevation: 2,
},

qtyText: {
  color: "#FFFFFF",
  fontWeight: "700",
  fontSize: 18,
},

qtyNumber: {
  fontSize: 17,
  fontWeight: "600",
  color: "#1E293B",
  minWidth: 30,
  textAlign: "center",
},
  deleteButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    marginLeft: "auto",
  },

  deleteText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },

  /* FLOATING TOTAL - MENGAMBANG */
  floatingTotal: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: "#1E293B",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
  },

  floatingTotalText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  /* PAYMENT BUTTON */
  paymentButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#64748B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },

  paymentButtonPaid: {
    backgroundColor: "#10B981",
  },

  paymentText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  /* OVERLAY (full screen) */
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },

  /* SIDEBAR */
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 270,
    backgroundColor: "#FFFFFF",
    paddingTop: 70,
    paddingHorizontal: 25,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 4, height: 0 },
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 20,
  },

  /* PROFILE */
  profileSection: {
    alignItems: "center",
    marginBottom: 35,
  },

  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#2563EB",
  },

  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  profileEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  /* MENU */
  menuSection: {
    gap: 22,
    marginTop: 25,
  },

  menuItem: {
    fontSize: 17,
    fontWeight: "600",
    paddingVertical: 10,
    color: "#2563EB",
  },
  saveTransactionButton: {
    position: 'absolute' as const,
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveTransactionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
});