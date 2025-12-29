// i18n.ts
import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

// Define which languages MenuCup actually supports
const supportedLocales = ['en', 'mk'];

export default getRequestConfig(async () => {
    const headerList = await headers();
    let locale = headerList.get('x-next-intl-locale') || 'en';

    // 🛡️ THE SAFETY CHECK: 
    // If the locale is 'sr' or anything else not in our list, use 'en'
    if (!supportedLocales.includes(locale)) {
        locale = 'en';
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});