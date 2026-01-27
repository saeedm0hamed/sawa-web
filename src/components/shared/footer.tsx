import Link from 'next/link';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const socialLinks = [
  { href: 'https://facebook.com/saeedm0hamed', icon: '/images/icons/facebook.png', label: 'فيسبوك' },
  { href: 'https://github.com/saeedm0hamed', icon: '/images/icons/github.png', label: 'جيتهب' },
  { href: 'https://linkedin.com/in/saeedm0hamed/', icon: '/images/icons/linkedin.png', label: 'لينكدان' },
];

export default function Footer() {
  return (
    <footer className='relative mt-8 px-4 md:px-8 bg-gradient-to-b from-[#ffffff08] to-[#ffffff15] backdrop-blur-xl border-t border-white/10 z-20 overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5'></div>
      <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent'></div>
      <div className='absolute top-10 right-20 w-24 h-24 bg-primary/10 rounded-full blur-3xl animate-pulse'></div>
      <div className='absolute bottom-16 left-12 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000'></div>

      <div className='relative py-6 md:py-8 pb-14'>
        <div className='flex flex-col md:flex-row gap-8 md:gap-96 justify-center md:items-center items-start'>
          {/* Entity 1 */}
          <div className='lg:col-span-1 space-y-2 md:space-y-4'>
            <div className='flex items-center gap-3 group'>
              <div className='relative'>
                <div className='absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500'></div>
                <div className='relative bg-gradient-to-br from-white/10 to-white/5 p-1 rounded-2xl border border-white/10'>
                  <Image
                    src='/images/sawa.webp'
                    width={55}
                    height={55}
                    alt='Sawa Logo'
                    className='transition-transform group-hover:scale-110 duration-300'
                  />
                </div>
              </div>
              <div>
                <h2 className='text-xl mb-1 font-bold'>سوا</h2>
                <p className='text-xs font-medium'>منصة الأفلام والمسلسلات</p>
              </div>
            </div>
          </div>

          {/* Entity 2 */}
          <div className='pt-2 order-3 md:order-2 md:border-none border-t border-white/10'>
            <div className='flex flex-col md:flex-row justify-between items-center gap-3'>
              <div className='text-center md:text-right'>
                <p className='text-white/70 text-xs md:text-sm' dir='ltr'>
                  © {new Date().getFullYear()} <span className='text-primary font-medium'>Sawa</span> كل الحقوق محفوظة
                </p>
              </div>
            </div>
          </div>

          {/* Entity 3 */}
          <div className='space-y-2'>
            <h3 className='text-md md:text-center font-bold text-white relative pb-2'>
              تواصل معنا
              <div className='absolute bottom-0 right-0 w-full h-0.5 bg-primary rounded-full'></div>
            </h3>

            <div className='flex justify-center space-x-4 flex-wrapace-x-4 flex-wrap'>
              <TooltipProvider>
                {socialLinks.map((social, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Link
                        href={social.href}
                        target='_blank'
                        className='group relative p-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20'
                      >
                        <Image
                          src={social.icon || '/placeholder.svg'}
                          width={18}
                          height={18}
                          alt={social.label}
                          className='transition-transform group-hover:scale-110 mx-auto'
                        />
                        <div className='absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300'></div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-white text-xs font-medium'>{social.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
