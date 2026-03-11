import createWebStorage from "redux-persist/lib/storage/createWebStorage";

const createNoopStorage = () => {
  return {
    getItem(key: string) {
      void key;
      return Promise.resolve(null);
    },
    setItem(key: string, value: string) {
      void key;
      return Promise.resolve(value);
    },
    removeItem(key: string) {
      void key;
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

export default storage;
