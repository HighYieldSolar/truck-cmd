"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useTranslation('landing');

  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/images/tc white-logo with name.png"
              alt="Truck Command"
              width={140}
              height={46}
              className="h-10 w-auto mb-4"
            />
            <p className="text-sm mb-4 whitespace-pre-line">
              {t('footer.tagline')}
            </p>
            <p className="text-sm">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.features')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features/invoicing" className="hover:text-white transition-colors">{t('footer.invoicing')}</Link></li>
              <li><Link href="/features/dispatching" className="hover:text-white transition-colors">{t('footer.loadManagement')}</Link></li>
              <li><Link href="/features/ifta-calculator" className="hover:text-white transition-colors">{t('footer.iftaCalculator')}</Link></li>
              <li><Link href="/features/expense-tracking" className="hover:text-white transition-colors">{t('footer.expenseTracking')}</Link></li>
              <li><Link href="/features/compliance" className="hover:text-white transition-colors">{t('footer.compliance')}</Link></li>
              <li><Link href="/features/fuel-tracker" className="hover:text-white transition-colors">{t('footer.fuelTracker')}</Link></li>
              <li><Link href="/features/state-mileage" className="hover:text-white transition-colors">{t('footer.stateMileage')}</Link></li>
              <li><Link href="/features/fleet-tracking" className="hover:text-white transition-colors">{t('footer.fleetManagement')}</Link></li>
              <li><Link href="/features/customer-management" className="hover:text-white transition-colors">{t('footer.customerCrm')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pricing" className="hover:text-white transition-colors">{t('footer.pricing')}</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">{t('footer.aboutUs')}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{t('footer.contact')}</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">{t('footer.faq')}</Link></li>
              <li><Link href="/feedback" className="hover:text-white transition-colors">{t('footer.feedback')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-white transition-colors">{t('footer.termsOfService')}</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link href="/cookies" className="hover:text-white transition-colors">{t('footer.cookiePolicy')}</Link></li>
              <li><Link href="/acceptable-use" className="hover:text-white transition-colors">{t('footer.acceptableUse')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">support@truckcommand.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
