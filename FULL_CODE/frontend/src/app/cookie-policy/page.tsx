import React from "react";

export const metadata = {
  title: "Cookie Policy | LifeSure AI",
  description: "Our strict approach to functional and performance cookies with zero third-party cross-site ad tracking.",
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8 text-xs leading-relaxed text-[#6F6A7C]">
      <div className="space-y-3 border-b border-[#D9D3E8] pb-6">
        <h1 className="text-3xl font-extrabold text-[#24212B]">Cookie Policy</h1>
        <p className="text-xs text-[#7F8FA4]">Transparency on cookies and local storage tokens.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">1. What Are Cookies?</h2>
        <p>
          Cookies and local storage objects are small text files placed on your device to enable core website functionalities, remember your
          theme preference (Dark or Light mode), and preserve your active calculator session.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">2. Cookies We Utilize</h2>
        <div className="overflow-x-auto rounded-xl border border-[#D9D3E8]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF9F6] text-[#6F6A7C]">
              <tr>
                <th className="p-3">Cookie Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Lifespan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D3E8]">
              <tr>
                <td className="p-3 font-mono font-bold text-[#24212B]">theme_pref</td>
                <td className="p-3">Strictly Functional</td>
                <td className="p-3">Stores user preference for dark or light theme interface</td>
                <td className="p-3">1 Year</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-[#24212B]">session_id</td>
                <td className="p-3">Essential Session</td>
                <td className="p-3">Maintains state between assessment steps during current visit</td>
                <td className="p-3">Session End</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#24212B]">3. Zero Third-Party Advertising Trackers</h2>
        <p>
          LifeSure AI does <strong>not</strong> implement third-party tracking pixels, behavioural surveillance cookies, or data-broker
          scripts that follow you across the internet.
        </p>
      </section>
    </div>
  );
}
