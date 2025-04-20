import React from 'react';
import { Facebook, Twitter, Linkedin, Mail, Copy, Check, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  compact?: boolean;
}

export function SocialShare({
  url = window.location.href,
  title = document.title,
  description = "Check out this SEO analysis tool!",
  className,
  variant = 'outline',
  size = 'default',
  compact = false
}: SocialShareProps) {
  const [copied, setCopied] = React.useState(false);
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({
        title: "Link copied to clipboard",
        duration: 2000
      });
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Failed to copy link",
        variant: "destructive",
        duration: 2000
      });
    });
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            className={cn("flex items-center", className)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer">
            <Facebook className="h-4 w-4 mr-2 text-blue-600" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">
            <Twitter className="h-4 w-4 mr-2 text-sky-500" />
            Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('linkedin')} className="cursor-pointer">
            <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('email')} className="cursor-pointer">
            <Mail className="h-4 w-4 mr-2 text-gray-600" />
            Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            Copy Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex space-x-2", className)}>
      <Button 
        variant={variant} 
        size={size} 
        onClick={() => handleShare('facebook')}
        title="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button 
        variant={variant} 
        size={size} 
        onClick={() => handleShare('twitter')}
        title="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button 
        variant={variant} 
        size={size} 
        onClick={() => handleShare('linkedin')}
        title="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button 
        variant={variant} 
        size={size} 
        onClick={() => handleShare('email')}
        title="Share via Email"
      >
        <Mail className="h-4 w-4" />
      </Button>
      <Button 
        variant={variant} 
        size={size} 
        onClick={handleCopyLink}
        title="Copy Link"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}