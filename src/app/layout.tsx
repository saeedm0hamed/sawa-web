// Next Types & Fonts
import type { Metadata } from 'next';
import { Alexandria } from 'next/font/google';

// Global Styles
import './globals.css';
import ScrollSmoothWrapper from '@/components/ScrollSmoothWrapper';

const alexandria = Alexandria({
  variable: '--font-geist-alexandria',
  subsets: ['arabic'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Sawa - سوا',

  description: 'سوا مكانك لمعرفة كل جديد عن الأفلام والمسلسلات، من القصة والتقييمات لحد مواعيد العرض، وكل ده بالعربي.',

  keywords: [
    // Sawa
    'Sawa',
    'Sawa Arabic',
    'Sawa Egypt',
    'Sawa HD',
    'Sawa Movies',
    'Sawa Series',

    // مكتبة سوا
    'مكتبة سوا',
    'مكتبة سوا بالعربي',
    'مكتبة سوا HD',
    'مكتبة سوا عربي',
    'مكتبة سوا مصر',
    'مكتبة سوا اونلاين',
    'مشاهدة مكتبة سوا',
    'تحميل مكتبة سوا',
    'أحدث أفلام مكتبة سوا',
    'أحدث مسلسلات مكتبة سوا',
    'افضل افلام مكتبة سوا',
    'افضل مسلسلات مكتبة سوا',
    'مكتبة أفلام سوا',
    'مكتبة مسلسلات سوا',
    'تقييمات مكتبة سوا',
    'ملخصات مكتبة سوا',
    'أخبار مكتبة سوا',

    // سوا
    'سوا',
    'سوا بالعربي',
    'سوا بالعربي HD',
    'سوا عربي',
    'سوا مصر',
    'سوا اونلاين',
    'مشاهدة سوا',
    'تحميل سوا',
    'أحدث أفلام سوا',
    'أحدث مسلسلات سوا',
    'افضل افلام سوا',
    'افضل مسلسلات سوا',
    'سوا HD',
    'تقييمات سوا',
    'ملخصات سوا',
    'أخبار سوا',

    // موفيز
    'موفيز',
    'موفيز بالعربي',
    'موفيز مصر',
    'موفيز عربي',

    // موسوعة الأفلام والمسلسلات
    'موسوعة أفلام',
    'موسوعة مسلسلات',
    'موسوعة الأفلام والمسلسلات',
    'قائمة أفلام عربية',
    'قائمة مسلسلات عربية',

    // بيانات وتقييمات
    'تفاصيل الأفلام',
    'تفاصيل المسلسلات',
    'ملخص أفلام',
    'ملخص المسلسلات',
    'تقييمات أفلام',
    'تقييمات مسلسلات',
    'تقييم أفلام بالعربي',
    'تقييم مسلسلات بالعربي',

    // أفلام ومسلسلات عامة
    'أفلام بالعربي',
    'مسلسلات بالعربي',
    'بيانات الأفلام',
    'مواعيد عرض الأفلام',
    'مواعيد عرض المسلسلات',
    'تصنيفات الأفلام',
    'تصنيفات المسلسلات',
    'أفضل أفلام',
    'أفضل مسلسلات',
    'مشاهدة الأفلام',
    'مشاهدة المسلسلات',
    'قائمة الأفلام',
    'قائمة المسلسلات',
    'مراجعة أفلام',
    'مراجعة مسلسلات',
    'أخبار الأفلام',
    'أخبار المسلسلات',
    'أفلام جديدة',
    'مسلسلات جديدة',
    'افلام HD',
    'مسلسلات HD',
    'أفلام 2025',
    'مسلسلات 2025',
  ],

  creator: 'Saeed Mohamed',
  publisher: 'Saeed Mohamed',

  metadataBase: new URL('https://sawa.vercel.app'),

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  applicationName: 'Sawa',
  openGraph: {
    title: 'Sawa - سوا',
    description:
      'سوا مكانك لمعرفة كل جديد عن الأفلام والمسلسلات، من القصة والتقييمات لحد مواعيد العرض، وكل ده بالعربي.',
    url: 'https://sawa.vercel.app',
    siteName: 'Sawa',
    images: [
      {
        url: '/images/sawa.png',
        width: 780,
        height: 780,
        alt: 'Sawa - سوا',
      },
    ],
    locale: 'ar_AR',
    type: 'website',
  },

  icons: {
    icon: '/images/sawa.png',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Sawa - سوا',
    description:
      'سوا مكانك لمعرفة كل جديد عن الأفلام والمسلسلات، من القصة والتقييمات لحد مواعيد العرض، وكل ده بالعربي.',
    images: ['https://sawa.vercel.app/images/sawa.png'],
    creator: '@saeedm0hamed',
  },

  verification: {
    google: 'IpDXTz417F3ZazMOu8KkliIfuwbw3wIFmNmPTG3LfI4',
  },

  other: {
    'google-site-verification': 'HJcQ06N13ZmafDcTz4ph34ghIvb37tCX9mqz9-zUcEk',
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ar' dir='rtl' className='dark' suppressHydrationWarning>
      <body className={`${alexandria.className} antialiased overflow-x-hidden`}>
        <ScrollSmoothWrapper>{children}</ScrollSmoothWrapper>
      </body>
    </html>
  );
}
