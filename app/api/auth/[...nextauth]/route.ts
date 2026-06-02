import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// GOOGLE
async function handleGoogle(user: any, account: any, profile: any) {
    try {
        await dbConnect();
        if (!user.email) return false;

        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
            const newUser = await User.create({
                user_id: user.id,
                email: user.email,
                authProvider: "google",
                display_name: user.name || "Google User",
                profile_image_url: user.image || "",
                role: "user",
                password_hash: undefined,
            });
            user.id = newUser.user_id.toString();
            return true;
        }

        if (account?.provider === "google") {
            if (!user.email) return false;
        }

        if (existingUser.authProvider !== "google") {
            existingUser.authProvider = "google";
            existingUser.display_name = existingUser.display_name || user.name;
            existingUser.profile_image_url = existingUser.profile_image_url || user.image;
            await existingUser.save();
        }

        user.id = existingUser.user_id.toString();
        return true;
    } catch (error) {
        console.error("Google Auth Database Error:", error);
        return false;
    }
}

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: String(process.env.GOOGLE_CLIENT_ID),
            clientSecret: String(process.env.GOOGLE_CLIENT_SECRET),
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                return await handleGoogle(user, account, profile);
            }
            return true;
        },
        async redirect({ url, baseUrl }) {
            return baseUrl + "/community";
        },
        async jwt({ token, user }) {
            if (user) { 
                token.email = user.email; 
                token.name = user.name; 
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) { 
                session.user.email = token.email; 
                session.user.name = token.name; 
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    pages: {
        signIn: "/auth-app/login",
    },
});

export async function GET(request: Request, context: any) {
    return handler(request, context);
}

export async function POST(request: Request, context: any) {
    return handler(request, context);
}