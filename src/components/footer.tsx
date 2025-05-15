export function Footer() {
  return (
    <footer className="border-t bg-muted/50 py-6">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Price Tracker. All rights reserved.</p>
          <p className="mt-1">
            <span className="text-xs">
              Currently supporting Amazon.in and Amazon.com. Designed and developed by{" "}
              <a href="x.com/gauravmandall" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-500">
                gauravmandall
                </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}
