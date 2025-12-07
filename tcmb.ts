
export interface ExchangeRates {
    USD: number;
    EUR: number;
    date: string;
}

export const fetchTCMBRates = async (): Promise<ExchangeRates> => {
    const targetUrl = 'https://www.tcmb.gov.tr/kurlar/today.xml';
    
    // Primary and Backup Proxies
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
    ];

    for (const url of proxies) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) continue;

            const xmlText = await response.text();
            
            if (!xmlText.includes('Tarih_Date')) continue;

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");

            const getDate = () => {
                const dateAttr = xmlDoc.getElementsByTagName("Tarih_Date")[0]?.getAttribute("Date");
                return dateAttr || new Date().toLocaleDateString('tr-TR');
            };

            const getRate = (code: string) => {
                const currencyNode = xmlDoc.querySelector(`Currency[CurrencyCode="${code}"]`);
                if (!currencyNode) return 0;
                const rateStr = currencyNode.querySelector("ForexSelling")?.textContent;
                return rateStr ? parseFloat(rateStr.replace(',', '.')) : 0;
            };

            const usd = getRate("USD");
            const eur = getRate("EUR");

            if (usd > 0 && eur > 0) {
                return { USD: usd, EUR: eur, date: getDate() };
            }

        } catch (error) {
            console.warn(`Proxy failed: ${url}`, error);
        }
    }

    // FALLBACK MODE (Prevents "Internal Error" or crash)
    console.warn("TCMB servisine erişilemedi. Çevrimdışı mod aktif.");
    return {
        USD: 32.50, // Fallback/Offline rates
        EUR: 35.20,
        date: 'Çevrimdışı Mod (Bağlantı Yok)'
    };
};
