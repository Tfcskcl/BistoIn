
import React from 'react';
import { ArrowLeft, Shield, FileText, RefreshCcw, Truck } from 'lucide-react';
import { Logo } from '../components/Logo';

interface LegalProps {
    docType: 'terms' | 'privacy' | 'refund' | 'shipping';
    onBack: () => void;
}

export const Legal: React.FC<LegalProps> = ({ docType, onBack }) => {
    const renderContent = () => {
        switch (docType) {
            case 'terms':
                return (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold text-slate-900">Terms & Conditions</h1>
                        <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
                        
                        <section>
                            <h2 className="text-xl font-bold mb-2">1. Introduction</h2>
                            <p>Welcome to BistroConnect. These Terms and Conditions govern your use of our website and software services. By accessing or using our service, you agree to be bound by these terms.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">2. Accounts</h2>
                            <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">3. Intellectual Property</h2>
                            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of TFCS KITCHEN SOLUTIONS LTD. and its licensors.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">4. Limitation of Liability</h2>
                            <p>In no event shall TFCS KITCHEN SOLUTIONS LTD., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">5. Governing Law</h2>
                            <p>These Terms shall be governed and construed in accordance with the laws of Gujarat, India, without regard to its conflict of law provisions.</p>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-bold mb-2">6. Contact Us</h2>
                            <p>If you have any questions about these Terms, please contact us at info@bistroconnect.in.</p>
                        </section>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
                        <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

                        <section>
                            <h2 className="text-xl font-bold mb-2">1. Information Collection</h2>
                            <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include name, email, restaurant details, and operational data.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">2. Use of Information</h2>
                            <p>We use the information we collect to provide, maintain, and improve our services, including analyzing restaurant operations, generating reports, and developing new features.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">3. Data Security</h2>
                            <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet is 100% secure.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">4. Sharing of Information</h2>
                            <p>We do not share your personal information with third parties except as described in this policy or with your consent. We may share data with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
                        </section>
                    </div>
                );
            case 'refund':
                return (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold text-slate-900">Refund & Cancellation Policy</h1>
                        <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

                        <section>
                            <h2 className="text-xl font-bold mb-2">1. Subscription Cancellation</h2>
                            <p>You may cancel your subscription at any time. Your cancellation will take effect at the end of the current paid term. There are no refunds for partial months of service.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">2. One-Time Setup Fees</h2>
                            <p>Setup fees cover the cost of initializing your secure database and AI model configuration. Once the onboarding process has commenced, setup fees are non-refundable.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">3. Credits & Top-ups</h2>
                            <p>Purchases of "Credits", "Recipe Packs", or "SOP Packs" are final and non-refundable. Credits do not expire as long as your account remains active.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">4. Requesting a Refund</h2>
                            <p>If you believe you were billed in error, please contact support at info@bistroconnect.in within 7 days of the billing date.</p>
                        </section>
                    </div>
                );
            case 'shipping':
                return (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold text-slate-900">Shipping Policy</h1>
                        <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

                        <section>
                            <h2 className="text-xl font-bold mb-2">1. Digital Goods</h2>
                            <p>BistroConnect is primarily a Software-as-a-Service (SaaS) platform. Services are delivered digitally via the internet. No physical shipping is required for subscriptions or credits.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">2. Hardware Orders</h2>
                            <p>In cases where hardware (such as CCTV cameras or NVRs) is purchased directly from us for Enterprise setups:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Processing Time:</strong> Orders are processed within 2-3 business days.</li>
                                <li><strong>Shipping Time:</strong> Standard delivery usually takes 3-7 business days across India.</li>
                                <li><strong>Carriers:</strong> We use reputable courier partners for all shipments.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-2">3. Contact</h2>
                            <p>For any shipping-related inquiries, please contact info@bistroconnect.in.</p>
                        </section>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            <nav className="border-b border-slate-200 py-4 px-6 sticky top-0 bg-white/95 backdrop-blur z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Logo iconSize={24} />
                    <button onClick={onBack} className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-2">
                        <ArrowLeft size={16} /> Back to Home
                    </button>
                </div>
            </nav>
            <div className="max-w-3xl mx-auto py-16 px-6">
                {renderContent()}
            </div>
            <footer className="bg-slate-50 py-12 border-t border-slate-200 mt-12">
                <div className="max-w-4xl mx-auto px-6 text-center text-slate-500 text-sm">
                    <p className="font-bold text-slate-900 mb-2">Bistro Connect</p>
                    <p>410 Divya Plaza, Opp. Kamalanagar Lake, Ajwa Road, Vadodara, Gujarat 390019</p>
                    <p className="mt-1 font-medium text-xs uppercase tracking-wider opacity-70">A part of TFCS KITCHEN SOLUTIONS LTD.</p>
                </div>
            </footer>
        </div>
    );
};
