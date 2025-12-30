
import { PlanType, RazorpayOptions, RazorpayResponse, User } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Razorpay Live Key should be provided via process.env.RAZORPAY_KEY
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY || 'rzp_live_placeholder'; 

export const paymentService = {
    loadRazorpayScript: (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => {
                console.error("Payment Gateway: Script load failed.");
                resolve(false);
            };
            document.body.appendChild(script);
        });
    },

    initiatePayment: async (
        user: User, 
        planType: PlanType, 
        amount: number, 
        onSuccess: (paymentId: string) => void,
        onFailure: (error: string) => void
    ) => {
        const isLoaded = await paymentService.loadRazorpayScript();

        if (!isLoaded) {
            onFailure("The secure payment gateway could not be reached. Please check your firewall or connection.");
            return;
        }

        // Production Configuration
        const options: any = {
            key: RAZORPAY_KEY_ID, 
            amount: Math.round(amount * 100), // Amount in paise
            currency: 'INR',
            name: 'BistroConnect Neural OS',
            description: `Provisioning ${planType.replace('_', ' ')} Node`,
            image: 'https://bistroconnect.in/favicon.ico',
            handler: function (response: RazorpayResponse) {
                console.log("Gateway: Transaction Authorized", response.razorpay_payment_id);
                onSuccess(response.razorpay_payment_id);
            },
            prefill: {
                name: user.name,
                email: user.email,
                contact: '' // Optional: Add user phone if available
            },
            notes: {
                plan: planType,
                user_id: user.id,
                deployment: 'Neural_Node_v2.5'
            },
            theme: {
                color: '#10b981' // Emerald-500
            },
            modal: {
                ondismiss: function() {
                    onFailure("Payment process cancelled by user.");
                }
            }
        };

        try {
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any){
                console.error("Gateway Error:", response.error.code);
                onFailure(response.error.description || "The transaction was declined by the bank.");
            });
            rzp.open();
        } catch (error) {
            console.error("Gateway Exception:", error);
            onFailure("Neural link to payment processor failed. Please try again.");
        }
    }
};
