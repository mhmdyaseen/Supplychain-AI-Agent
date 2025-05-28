'use client'

import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'

function SignOutButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      className="z-10 cursor-pointer rounded bg-destructive px-4 py-2 font-bold text-background hover:bg-destructive/80"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <p>Sign Out</p>
        <Icon type="log-out" size="xs" className="text-background" />
      </div>
    </Button>
  )
}

export default SignOutButton
