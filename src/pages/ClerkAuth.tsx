import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";

export default function ClerkAuth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              StyleAI
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create stunning AI-generated images
          </p>
        </div>

        {/* Authentication Tabs */}
        <Card className="backdrop-blur-sm bg-background/80 border border-border/50 shadow-xl">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader className="space-y-1 pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <TabsContent value="signin" className="space-y-4">
                <div className="text-center">
                  <CardTitle className="text-xl">Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue
                  </CardDescription>
                </div>
                <div className="flex justify-center">
                  <SignIn 
                    forceRedirectUrl="/"
                    signUpUrl="/auth"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="text-center">
                  <CardTitle className="text-xl">Create your account</CardTitle>
                  <CardDescription>
                    Get started with StyleAI today
                  </CardDescription>
                </div>
                <div className="flex justify-center">
                  <SignUp 
                    forceRedirectUrl="/"
                    signInUrl="/auth"
                  />
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-primary">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}