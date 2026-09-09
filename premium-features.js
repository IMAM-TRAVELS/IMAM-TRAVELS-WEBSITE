// WEBSITE ENHANCEMENTS - Additional Features & Utilities
// This file contains premium features to enhance user experience

// ============================================
// PREMIUM REFERRAL PROGRAM
// ============================================
function openReferralProgram() {
  const modal = document.createElement("div");
  modal.id = "referralModal";
  modal.style.cssText =
    "display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 3000; align-items: center; justify-content: center; backdrop-filter: blur(5px);";
  modal.innerHTML = `
    <div style="background: white; padding: 2.5rem; border-radius: 16px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2><i class="fas fa-share-alt"></i> Referral Program</h2>
        <button onclick="document.getElementById('referralModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
      </div>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem;">🎁 Earn Rewards!</h3>
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;"><strong>Get PKR 2,500</strong> for each friend you refer</p>
        <p style="opacity: 0.9;">Your friend gets <strong>10% discount</strong> on their first booking!</p>
      </div>
      <div style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem;">How It Works:</h3>
        <ol style="margin-left: 1.5rem;">
          <li style="margin-bottom: 0.8rem;">📤 Share your unique code: <strong style="color: #667eea; font-size: 1.1rem;">IMAMTRAVEL${Math.random().toString(36).substr(2, 9).toUpperCase()}</strong></li>
          <li style="margin-bottom: 0.8rem;">👥 Your friend signs up using your code</li>
          <li style="margin-bottom: 0.8rem;">🎉 They book a trip - you both get rewards</li>
          <li style="margin-bottom: 0.8rem;">💰 Withdraw rewards to your account</li>
        </ol>
      </div>
      <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
        <p style="text-align: center; margin: 0;"><i class="fas fa-crown"></i> <strong>Tier Benefits:</strong></p>
        <p style="text-align: center; margin: 0.5rem 0 0 0; font-size: 0.9rem;">5 referrals = Silver (7.5% commission) | 10 referrals = Gold (10% commission) | 20 referrals = Platinum (15% commission)</p>
      </div>
      <button onclick="alert('✅ Referral code copied to clipboard!'); document.getElementById('referralModal').remove();" class="cta-button" style="width: 100%; background: #667eea;">Copy Referral Code</button>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================
// TRAVEL INSURANCE COMPARISON
// ============================================
function openInsuranceComparison() {
  const modal = document.createElement("div");
  modal.id = "insuranceModal";
  modal.style.cssText =
    "display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 3000; align-items: center; justify-content: center; backdrop-filter: blur(5px);";
  modal.innerHTML = `
    <div style="background: white; padding: 2.5rem; border-radius: 16px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2><i class="fas fa-shield-alt"></i> Travel Insurance Plans</h2>
        <button onclick="document.getElementById('insuranceModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
        <div style="border: 2px solid #ddd; padding: 1.5rem; border-radius: 8px;">
          <h3 style="color: #667eea; margin-bottom: 1rem;">Basic Plan</h3>
          <p style="font-size: 1.2rem; font-weight: bold; color: #333; margin-bottom: 0.5rem;">PKR 799/trip</p>
          <ul style="list-style: none; margin: 1rem 0;">
            <li style="margin-bottom: 0.5rem;">✓ Medical coverage: PKR 50,000</li>
            <li style="margin-bottom: 0.5rem;">✓ Flight cancellation</li>
            <li style="margin-bottom: 0.5rem;">✓ Baggage loss</li>
            <li style="margin-bottom: 0.5rem;">✗ Adventure activities</li>
          </ul>
          <button onclick="alert('✅ Basic plan added to cart!')" style="width: 100%; padding: 0.8rem; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Select Plan</button>
        </div>
        <div style="border: 3px solid #667eea; padding: 1.5rem; border-radius: 8px; position: relative; background: linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,178,0.05) 100%);">
          <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #667eea; color: white; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">POPULAR</div>
          <h3 style="color: #667eea; margin-bottom: 1rem;">Premium Plan</h3>
          <p style="font-size: 1.2rem; font-weight: bold; color: #333; margin-bottom: 0.5rem;">PKR 1,299/trip</p>
          <ul style="list-style: none; margin: 1rem 0;">
            <li style="margin-bottom: 0.5rem;">✓ Medical coverage: PKR 100,000</li>
            <li style="margin-bottom: 0.5rem;">✓ Flight cancellation</li>
            <li style="margin-bottom: 0.5rem;">✓ Baggage loss & delay</li>
            <li style="margin-bottom: 0.5rem;">✓ Adventure activities</li>
          </ul>
          <button onclick="alert('✅ Premium plan added to cart!')" style="width: 100%; padding: 0.8rem; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Select Plan</button>
        </div>
        <div style="border: 2px solid #ddd; padding: 1.5rem; border-radius: 8px;">
          <h3 style="color: #764ba2; margin-bottom: 1rem;">Elite Plan</h3>
          <p style="font-size: 1.2rem; font-weight: bold; color: #333; margin-bottom: 0.5rem;">PKR 1,999/trip</p>
          <ul style="list-style: none; margin: 1rem 0;">
            <li style="margin-bottom: 0.5rem;">✓ Medical coverage: PKR 200,000</li>
            <li style="margin-bottom: 0.5rem;">✓ All coverage included</li>
            <li style="margin-bottom: 0.5rem;">✓ Travel assistance 24/7</li>
            <li style="margin-bottom: 0.5rem;">✓ Family coverage option</li>
          </ul>
          <button onclick="alert('✅ Elite plan added to cart!')" style="width: 100%; padding: 0.8rem; background: #764ba2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Select Plan</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================
// TRAVEL BUDDY FINDER
// ============================================
function openTravelBuddy() {
  const modal = document.createElement("div");
  modal.id = "travelBuddyModal";
  modal.style.cssText =
    "display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 3000; align-items: center; justify-content: center; backdrop-filter: blur(5px);";
  modal.innerHTML = `
    <div style="background: white; padding: 2.5rem; border-radius: 16px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2><i class="fas fa-people-line"></i> Find Travel Buddy</h2>
        <button onclick="document.getElementById('travelBuddyModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
      </div>
      <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center;">
        <i class="fas fa-search" style="font-size: 2rem; color: #667eea; margin-bottom: 1rem; display: block;"></i>
        <p style="color: #666; margin: 0;">Connect with fellow travelers heading to the same destination!</p>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Your Destination</label>
        <input type="text" placeholder="e.g., Dubai, London, Bangkok" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-family: inherit;">
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Travel Dates</label>
        <input type="date" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-family: inherit;">
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Budget Range</label>
        <select style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-family: inherit;">
          <option>Economy (< PKR 50,000)</option>
          <option>Mid-Range (PKR 50,000 - 100,000)</option>
          <option>Luxury (> PKR 100,000)</option>
        </select>
      </div>
      <button onclick="alert('✅ Profile created! We\\'ll show you travel buddies for your trip'); document.getElementById('travelBuddyModal').remove();" class="cta-button" style="width: 100%; background: #667eea;">Find Buddies</button>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================
// HAJJ COUNTDOWN & GUIDE
// ============================================
function openHajjGuide() {
  const modal = document.createElement("div");
  modal.id = "hajjModal";
  modal.style.cssText =
    "display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 3000; align-items: center; justify-content: center; backdrop-filter: blur(5px);";
  modal.innerHTML = `
    <div style="background: white; padding: 2.5rem; border-radius: 16px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2><i class="fas fa-kaaba"></i> Hajj 2026 Guide</h2>
        <button onclick="document.getElementById('hajjModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
      </div>
      <div style="background: linear-gradient(135deg, #2d5016 0%, #1a2f0a 100%); color: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">
        <p style="font-size: 0.9rem; opacity: 0.9; margin: 0 0 0.5rem 0;">Hajj Countdown</p>
        <p style="font-size: 2rem; font-weight: bold; margin: 0;">234 Days</p>
        <p style="font-size: 0.9rem; opacity: 0.9; margin: 0.5rem 0 0 0;">Until Hajj 2026</p>
      </div>
      <div style="margin-bottom: 2rem;">
        <h3 style="color: #2d5016; margin-bottom: 1rem;">📜 The Five Pillars of Hajj</h3>
        <div style="display: grid; gap: 1rem;">
          <div style="border-left: 4px solid #2d5016; padding-left: 1rem;">
            <strong>1. Ihram (Sacred State)</strong>
            <p style="margin: 0.3rem 0 0 0; color: #666;">Enter the sanctified state at designated stations</p>
          </div>
          <div style="border-left: 4px solid #2d5016; padding-left: 1rem;">
            <strong>2. Tawaf (Circumambulation)</strong>
            <p style="margin: 0.3rem 0 0 0; color: #666;">Circle the Kaaba seven times counter-clockwise</p>
          </div>
          <div style="border-left: 4px solid #2d5016; padding-left: 1rem;">
            <strong>3. Sa'y (Running Between Hills)</strong>
            <p style="margin: 0.3rem 0 0 0; color: #666;">Walk between Safa and Marwa seven times</p>
          </div>
          <div style="border-left: 4px solid #2d5016; padding-left: 1rem;">
            <strong>4. Arafat (Day of Standing)</strong>
            <p style="margin: 0.3rem 0 0 0; color: #666;">Stand and pray at Mount Arafat from dawn to sunset</p>
          </div>
          <div style="border-left: 4px solid #2d5016; padding-left: 1rem;">
            <strong>5. Return & Stoning Ritual</strong>
            <p style="margin: 0.3rem 0 0 0; color: #666;">Perform Tawaf al-Ifadah and stone pillars</p>
          </div>
        </div>
      </div>
      <button onclick="alert('📚 Download complete Hajj guide PDF'); document.getElementById('hajjModal').remove();" class="cta-button" style="width: 100%; background: #2d5016;">Download Full Guide</button>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================
// NEWSLETTER SUBSCRIPTION WITH VALIDATION
// ============================================
function subscribeNewsletter(email) {
  if (!email) {
    alert("❌ Please enter your email address");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("❌ Please enter a valid email address");
    return;
  }
  alert(
    "✅ Welcome to IMAM TRAVELS newsletter!\n\nYou'll receive:\n• Exclusive travel deals\n• Destination guides\n• Travel tips & trends",
  );
  document.querySelector(".newsletter-input").value = "";
}

// ============================================
// PREMIUM MEMBERSHIP TIER
// ============================================
function openMembershipTiers() {
  const modal = document.createElement("div");
  modal.id = "membershipModal";
  modal.style.cssText =
    "display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 3000; align-items: center; justify-content: center; backdrop-filter: blur(5px);";
  modal.innerHTML = `
    <div style="background: white; padding: 2.5rem; border-radius: 16px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2><i class="fas fa-crown"></i> Premium Membership Tiers</h2>
        <button onclick="document.getElementById('membershipModal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-top: 2rem;">
        <div style="border: 2px solid #ccc; padding: 2rem; border-radius: 12px; text-align: center;">
          <h3 style="color: #333; margin-bottom: 0.5rem;">🥉 Silver</h3>
          <p style="color: #666; margin-bottom: 1rem;">For occasional travelers</p>
          <p style="font-size: 1.3rem; font-weight: bold; margin-bottom: 1.5rem;">FREE</p>
          <ul style="list-style: none; margin-bottom: 1.5rem; text-align: left;">
            <li style="margin-bottom: 0.5rem; color: #666;">✓ 5% discount on flights</li>
            <li style="margin-bottom: 0.5rem; color: #666;">✓ Booking confirmation via email</li>
            <li style="margin-bottom: 0.5rem; color: #666;">✗ Priority customer support</li>
          </ul>
          <button onclick="alert('✅ You\\'re already Silver member!');" style="width: 100%; padding: 0.8rem; background: #ccc; border: none; cursor: pointer; border-radius: 6px; font-weight: 600;">Current Plan</button>
        </div>
        <div style="border: 3px solid #FFD700; padding: 2rem; border-radius: 12px; text-align: center; position: relative; background: linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(255,215,0,0.05) 100%); transform: scale(1.05);">
          <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #FFD700; color: #333; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">MOST POPULAR</div>
          <h3 style="color: #FFD700; margin-bottom: 0.5rem;">🥈 Gold</h3>
          <p style="color: #666; margin-bottom: 1rem;">For frequent travelers</p>
          <p style="font-size: 1.8rem; font-weight: bold; margin: 1rem 0;">PKR 999<span style="font-size: 0.8rem; color: #666;">/year</span></p>
          <ul style="list-style: none; margin-bottom: 1.5rem; text-align: left;">
            <li style="margin-bottom: 0.5rem; color: #666;">✓ 12% discount on flights</li>
            <li style="margin-bottom: 0.5rem; color: #666;">✓ Free hotel upgrades</li>
            <li style="margin-bottom: 0.5rem; color: #666;">✓ Priority 24/7 support</li>
            <li style="margin-bottom: 0.5rem; color: #666;">✓ Birthday discount voucher</li>
          </ul>
          <button onclick="alert('✅ Gold membership activated!');" style="width: 100%; padding: 0.8rem; background: #FFD700; border: none; cursor: pointer; border-radius: 6px; font-weight: 600;">Upgrade Now</button>
        </div>
        <div style="border: 2px solid #FF6B9D; padding: 2rem; border-radius: 12px; text-align: center;">
          <h3 style="color: #FF6B9D; margin-bottom: 0.5rem;">🥇 Platinum</h3>
          <p style="color: #666; margin-bottom: 1rem;">For VIP travelers</p>
          <p style="font-size: 1.3rem; font-weight: bold; margin-bottom: 1.5rem;">PKR 2,999<span style="font-size: 0.8rem; color: #666;">/year</span></p>
          <ul style="list-style: none; margin-bottom: 1.5rem; text-align: left;">
            <li style="margin-bottom: 0.5rem; color: #666;">✓ 20% discount on everything</li>
            <li style="margin-bottom: 0.5rem; color: #666;">✓ Free travel insurance</li>
            <li style="margin-bottom: 0.5rem; color: #666;">✓ Personal travel assistant</li>
            <li style="margin-bottom: 0.5rem; color: #666;">✓ Exclusive airport lounge access</li>
          </ul>
          <button onclick="alert('✅ Platinum membership activated!');" style="width: 100%; padding: 0.8rem; background: #FF6B9D; color: white; border: none; cursor: pointer; border-radius: 6px; font-weight: 600;">Upgrade Now</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================
// DESTINATION RECOMMENDATION ENGINE
// ============================================
function openDestinationQuiz() {
  const modal = document.createElement("div");
  modal.id = "quizModal";
  modal.style.cssText =
    "display: flex; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 3000; align-items: center; justify-content: center; backdrop-filter: blur(5px);";
  modal.innerHTML = `
    <div style="background: white; padding: 2.5rem; border-radius: 16px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
      <h2 style="margin-bottom: 2rem;"><i class="fas fa-compass"></i> Destination Finder</h2>
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">What's your travel style?</label>
        <select style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-family: inherit;">
          <option>Beach & Relaxation</option>
          <option>Adventure & Hiking</option>
          <option>Cultural & History</option>
          <option>Shopping & Nightlife</option>
          <option>Religious & Spiritual</option>
        </select>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Budget per person?</label>
        <select style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-family: inherit;">
          <option>Budget (< PKR 50,000)</option>
          <option>Mid-Range (PKR 50,000 - 150,000)</option>
          <option>Luxury (> PKR 150,000)</option>
        </select>
      </div>
      <div style="margin-bottom: 2rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Duration?</label>
        <select style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-family: inherit;">
          <option>Weekend (2-3 days)</option>
          <option>Short Trip (4-7 days)</option>
          <option>Extended (8-14 days)</option>
          <option>Long Term (15+ days)</option>
        </select>
      </div>
      <button onclick="alert('🎯 Best Destinations for You:\\n\\n1. Dubai - Perfect for shopping & relaxation\\n2. Istanbul - Great for culture & history\\n3. Bangkok - Adventure & nightlife\\n4. Maldives - Ultimate beach getaway'); document.getElementById('quizModal').remove();" class="cta-button" style="width: 100%; background: #667eea;">Get Recommendations</button>
    </div>
  `;
  document.body.appendChild(modal);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Make functions globally available
  window.openReferralProgram = openReferralProgram;
  window.openInsuranceComparison = openInsuranceComparison;
  window.openTravelBuddy = openTravelBuddy;
  window.openHajjGuide = openHajjGuide;
  window.subscribeNewsletter = subscribeNewsletter;
  window.openMembershipTiers = openMembershipTiers;
  window.openDestinationQuiz = openDestinationQuiz;
});

console.log("✓ Premium website enhancements loaded");
