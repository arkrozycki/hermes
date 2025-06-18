'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginCredentials, loginSchema } from '@/lib/validations/login'
import { authService } from '@/lib/services/auth.service'
import { ApiErrorException } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import React from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [loginError, setLoginError] = React.useState<string>('')

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setLoginError('')
      await authService.login(data)
      router.push('/translate')
    } catch (error) {
      console.log('Login error:', error)
      if (error instanceof ApiErrorException) {
        if (error.data?.non_field_errors?.[0]) {
          setLoginError(error.data.non_field_errors[0])
        } else if (error.data?.detail) {
          setLoginError(error.data.detail)
        } else if (error.data?.message) {
          setLoginError(error.data.message)
        } else {
          setLoginError(error.message)
        }
      } else {
        setLoginError('An unexpected error occurred')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-background">
      <Card className="w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl">
           Hermes
          </CardTitle>
          <CardDescription className="text-center">
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 mb-4 text-center">
              {loginError}
            </div>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full">
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-muted-foreground text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
