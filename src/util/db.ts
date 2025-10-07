// 数据库操作工具
import { error } from "@/util/logger";

const DB_NAME = "PluginFrameworkDB";
const DB_VERSION = 2; // 增加版本号以触发数据库升级
const STORE_NAME = "pluginData";
const PLUGIN_STATUS_STORE = "pluginStatus";

/**
 * 检查存储对象是否存在
 * @param db 数据库实例
 * @param storeName 存储对象名称
 * @returns 是否存在
 */
function storeExists(db: IDBDatabase, storeName: string): boolean {
  return db.objectStoreNames.contains(storeName);
}

/**
 * 安全地获取事务
 * @param db 数据库实例
 * @param storeName 存储对象名称
 * @param mode 事务模式
 * @returns 事务对象或null
 */
function safeTransaction(db: IDBDatabase, storeName: string, mode: IDBTransactionMode): IDBTransaction | null {
  if (!storeExists(db, storeName)) {
    error(`存储对象 ${storeName} 不存在`);
    return null;
  }
  return db.transaction(storeName, mode);
}

// 打开数据库连接
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // 数据库版本升级时调用
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // 创建存储对象，以插件名为键
        db.createObjectStore(STORE_NAME, { keyPath: "name" });
      }
      if (!db.objectStoreNames.contains(PLUGIN_STATUS_STORE)) {
        // 创建插件状态存储对象，以插件名为键
        db.createObjectStore(PLUGIN_STATUS_STORE, { keyPath: "name" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      error("Failed to open database:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// 保存插件数据
export async function savePluginData(pluginName: string, data: Record<string, any>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = safeTransaction(db, STORE_NAME, "readwrite");
    if (!transaction) {
      db.close();
      reject(new Error(`无法创建事务：存储对象 ${STORE_NAME} 不存在`));
      return;
    }

    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ name: pluginName, data });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * 保存插件状态（enable属性）
 * @param pluginName 插件名称
 * @param enable 插件启用状态
 */
export async function savePluginStatus(pluginName: string, enable: boolean): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = safeTransaction(db, PLUGIN_STATUS_STORE, "readwrite");
    if (!transaction) {
      db.close();
      reject(new Error(`无法创建事务：存储对象 ${PLUGIN_STATUS_STORE} 不存在`));
      return;
    }

    const store = transaction.objectStore(PLUGIN_STATUS_STORE);
    const request = store.put({ name: pluginName, enable });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * 获取插件状态（enable属性）
 * @param pluginName 插件名称
 * @returns 插件启用状态，如果未找到则返回null
 */
export async function getPluginStatus(pluginName: string): Promise<boolean | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = safeTransaction(db, PLUGIN_STATUS_STORE, "readonly");
    if (!transaction) {
      db.close();
      resolve(null); // 如果存储对象不存在，返回null而不是错误
      return;
    }

    const store = transaction.objectStore(PLUGIN_STATUS_STORE);
    const request = store.get(pluginName);

    request.onsuccess = () => {
      resolve(request.result ? request.result.enable : null);
    };
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * 获取所有插件状态
 * @returns 所有插件的状态数组
 */
export async function getAllPluginStatus(): Promise<Array<{ name: string; enable: boolean }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = safeTransaction(db, PLUGIN_STATUS_STORE, "readonly");
    if (!transaction) {
      db.close();
      resolve([]); // 如果存储对象不存在，返回空数组
      return;
    }

    const store = transaction.objectStore(PLUGIN_STATUS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

// 获取插件数据
export async function getPluginData(pluginName: string): Promise<Record<string, any> | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = safeTransaction(db, STORE_NAME, "readonly");
    if (!transaction) {
      db.close();
      resolve(null); // 如果存储对象不存在，返回null
      return;
    }

    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(pluginName);

    request.onsuccess = () => {
      resolve(request.result ? request.result.data : null);
    };
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

// 获取所有插件数据
export async function getAllPluginData(): Promise<Array<{ name: string; data: Record<string, any> }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = safeTransaction(db, STORE_NAME, "readonly");
    if (!transaction) {
      db.close();
      resolve([]); // 如果存储对象不存在，返回空数组
      return;
    }

    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}
