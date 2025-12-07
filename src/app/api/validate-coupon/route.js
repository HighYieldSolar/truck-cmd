// src/app/api/validate-coupon/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request) {
  try {
    const { couponCode, plan, billingCycle } = await request.json();

    if (!couponCode) {
      return NextResponse.json({
        valid: false,
        error: 'Coupon code is required'
      }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Pricing in cents
    const pricing = {
      basic: { monthly: 2000, yearly: 19200 },
      premium: { monthly: 3500, yearly: 33600 },
      fleet: { monthly: 7500, yearly: 72000 }
    };

    try {
      // Try to retrieve the coupon - first try exact match, then uppercase
      let coupon;
      try {
        coupon = await stripe.coupons.retrieve(couponCode.trim());
      } catch (exactMatchErr) {
        // If exact match fails, try uppercase (some coupons might be created with uppercase IDs)
        if (exactMatchErr.code === 'resource_missing') {
          coupon = await stripe.coupons.retrieve(couponCode.trim().toUpperCase());
        } else {
          throw exactMatchErr;
        }
      }

      if (!coupon || !coupon.valid) {
        return NextResponse.json({
          valid: false,
          error: 'This coupon is no longer valid'
        });
      }

      // Check if coupon has any restrictions
      if (coupon.redeem_by && coupon.redeem_by * 1000 < Date.now()) {
        return NextResponse.json({
          valid: false,
          error: 'This coupon has expired'
        });
      }

      if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
        return NextResponse.json({
          valid: false,
          error: 'This coupon has reached its maximum redemptions'
        });
      }

      // Calculate discount
      let discountAmount = 0;
      let discountDisplay = '';
      const originalPrice = plan && billingCycle ? pricing[plan]?.[billingCycle] || 0 : 0;

      if (coupon.percent_off) {
        discountAmount = Math.round(originalPrice * (coupon.percent_off / 100));
        discountDisplay = `${coupon.percent_off}% off`;
      } else if (coupon.amount_off) {
        discountAmount = Math.min(coupon.amount_off, originalPrice);
        discountDisplay = `$${(Math.round(coupon.amount_off) / 100).toFixed(2)} off`;
      }

      const finalPrice = Math.max(0, originalPrice - discountAmount);

      // Build duration message
      let durationMessage = '';
      switch (coupon.duration) {
        case 'once':
          durationMessage = 'Applied to first payment only';
          break;
        case 'repeating':
          durationMessage = `Applied for ${coupon.duration_in_months} month${coupon.duration_in_months > 1 ? 's' : ''}`;
          break;
        case 'forever':
          durationMessage = 'Applied to all future payments';
          break;
      }

      return NextResponse.json({
        valid: true,
        coupon: {
          id: coupon.id,
          name: coupon.name || coupon.id,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off ? Math.round(coupon.amount_off) / 100 : null,
          duration: coupon.duration,
          durationInMonths: coupon.duration_in_months,
          discountDisplay,
          durationMessage
        },
        pricing: plan && billingCycle ? {
          originalPrice: Math.round(originalPrice) / 100,
          discountAmount: Math.round(discountAmount) / 100,
          finalPrice: Math.round(finalPrice) / 100
        } : null
      });

    } catch (stripeError) {
      // Coupon not found
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({
          valid: false,
          error: 'Invalid coupon code'
        });
      }
      throw stripeError;
    }

  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({
      valid: false,
      error: 'Failed to validate coupon'
    }, { status: 500 });
  }
}
