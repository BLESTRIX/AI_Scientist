import { Client, Account, Databases, ID } from 'appwrite';

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'YOUR_PROJECT_ID'); // We'll add this to .env later

export const account = new Account(client);
export const databases = new Databases(client);
export { ID };