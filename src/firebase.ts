// מוק מלא ומורחב למניעת שגיאות קומפילציה וטיפוסים
export const auth: any = {
  currentUser: { uid: "local-user", email: "june@app.local" },
  onAuthStateChanged: (callback: any) => {
    callback({ uid: "local-user", email: "june@app.local" });
    return () => {};
  },
  signOut: async () => true,
  app: {},
  name: "local-auth",
  config: {}
};

export const db: any = {};

// פונקציות אימות
export const onAuthStateChanged = (authObj: any, callback: any) => {
  callback({ uid: "local-user", email: "june@app.local" });
  return () => {};
};
export const signOut = async () => true;

// פונקציות Firestore כמערכים ריקים או פונקציות שלא מחזירות כלום
export const doc = (...args: any[]): any => ({ id: args[2] || "local-id" });
export const setDoc = async () => true;
export const getDoc = async () => ({ exists: () => false, data: () => null });
export const onSnapshot = (docRef: any, callback: any) => {
  return () => {};
};
export const collection = (...args: any[]): any => ({});
export const query = (...args: any[]): any => ({});
export const where = (...args: any[]): any => ({});
export const updateDoc = async () => true;
export const arrayUnion = (...args: any[]) => args;
export const getDocs = async () => ({ empty: true, docs: [] });
export const deleteDoc = async () => true;
export const deleteField = () => undefined;