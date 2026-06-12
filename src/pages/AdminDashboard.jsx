import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, Download, Settings, FileText, Tag, LayoutDashboard, Users, Search, MessageSquare, Mail, Check, X, ShieldAlert, Eye, AlertCircle, DollarSign, Upload, Link, Brain, Image, Bell, BookOpen } from 'lucide-react';
import { articleService, categoryService, settingsService, storageService, subscriberService, commentService, contactMessageService, userService, campaignService, errorLogService, mediaLibraryService, notificationService, affiliateService, webStoryService } from '../supabase';

export default function AdminDashboard({
  articles = [],
  setArticles,
  categories = [],
  setCategories,
  settings = {},
  setSettings,
  setCurrentRoute,
  activeTabProp = 'dashboard'
}) {
  const activeTab = activeTabProp;
  const [editingArticle, setEditingArticle] = useState(null); // null or article object
  const [showEditorForm, setShowEditorForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [subscribersView, setSubscribersView] = useState('list');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [artPublishedAt, setArtPublishedAt] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [seoAnalysis, setSeoAnalysis] = useState(null);
  const [aiTags, setAiTags] = useState([]);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [extendingContent, setExtendingContent] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [alert, setAlert] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [subscribers, setSubscribers] = useState([]);
  const [searchSubQuery, setSearchSubQuery] = useState('');
  
  const [comments, setComments] = useState([]);
  const [searchCommQuery, setSearchCommQuery] = useState('');
  const [filterCommArticle, setFilterCommArticle] = useState('');
  const [filterCommDate, setFilterCommDate] = useState('');
  const [filterCommStatus, setFilterCommStatus] = useState('all');
  const [loadingCms, setLoadingCms] = useState(true);
  const [cmsError, setCmsError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [searchMsgQuery, setSearchMsgQuery] = useState('');

  const [usersList, setUsersList] = useState([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const [siteSettings, setSiteSettings] = useState({
    siteName: 'DigiLokam',
    siteTagline: 'Your Digital Technology Hub',
    supportEmail: 'usmanputtamanna@gmail.com',
    whatsappNumber: '+91 9061354069',
    copyrightText: `© ${new Date().getFullYear()} DigiLokam. All rights reserved.`
  });

  // Helper to parse localStorage for fallback checks
  const getLocalStorageData = (key, defaultData) => {
    const data = localStorage.getItem(key);
    if (!data) return defaultData;
    try {
      return JSON.parse(data);
    } catch (e) {
      return defaultData;
    }
  };

  useEffect(() => {
    const loadCmsData = async () => {
      setLoadingCms(true);
      setCmsError(null);
      try {
        const [subs, comms, msgs, usrs, camps, errLogs, media, notifs, links, stors] = await Promise.all([
          subscriberService.getAll(),
          commentService.getAll(),
          contactMessageService.getAll(),
          userService.getAll(),
          campaignService.getAll(),
          errorLogService.getAll(),
          mediaLibraryService.getAll(),
          notificationService.getAll(),
          affiliateService.getAll(),
          webStoryService.getAll()
        ]);
        setSubscribers(subs);
        setComments(comms);
        setMessages(msgs);
        setUsersList(usrs);
        setCampaigns(camps || []);
        setErrorLogs(errLogs || []);
        setMediaItems(media || []);
        setNotifications(notifs || []);
        setAffiliateLinks(links || []);
        setStories(stors || []);
      } catch (e) {
        console.error("Error loading CMS data:", e);
        setCmsError(e.message || 'Failed to load dashboard data.');
      } finally {
        setLoadingCms(false);
      }
    };
    loadCmsData();

    // Load general site settings from localStorage
    const savedSite = localStorage.getItem('digilokam_site_settings');
    if (savedSite) {
      try {
        setSiteSettings(JSON.parse(savedSite));
      } catch (e) {
        console.error("Error loading site settings:", e);
      }
    }
  }, []);

  const handleMarkNotifRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      console.error("Error marking notification read:", e);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => notificationService.markAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error("Error marking all read:", e);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error("Error deleting notification:", e);
    }
  };

  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchSubQuery.toLowerCase().trim())
  );

  const handleDeleteSubscriber = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscriber?')) {
      try {
        await subscriberService.delete(id);
        setSubscribers(prev => prev.filter(s => s.id !== id));
        triggerAlert('Subscriber deleted!', 'success');
      } catch (e) {
        console.error(e);
        triggerAlert('Could not delete subscriber.', 'danger');
      }
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      triggerAlert('No subscribers to export.', 'danger');
      return;
    }
    let csvContent = '\uFEFFid,email,subscribed_at,status\n';
    subscribers.forEach(sub => {
      csvContent += `"${sub.id}","${sub.email}","${sub.subscribed_at}","${sub.status}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'subscribers_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerAlert('Subscribers exported to CSV successfully!', 'success');
  };

  // Comment Handlers
  const handleApproveComment = async (id) => {
    try {
      await commentService.approve(id);
      setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
      triggerAlert('Comment approved successfully!', 'success');
    } catch (e) {
      console.error(e);
      triggerAlert('Could not approve comment: ' + (e.message || 'Unknown error'), 'danger');
    }
  };

  const handleRejectComment = async (id) => {
    try {
      await commentService.reject(id);
      setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
      triggerAlert('Comment rejected successfully!', 'warning');
    } catch (e) {
      console.error(e);
      triggerAlert('Could not reject comment: ' + (e.message || 'Unknown error'), 'danger');
    }
  };

  const handleDeleteComment = async (id) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentService.delete(id);
        setComments(prev => prev.filter(c => c.id !== id));
        triggerAlert('Comment deleted successfully!', 'success');
      } catch (e) {
        console.error(e);
        triggerAlert('Could not delete comment: ' + (e.message || 'Unknown error'), 'danger');
      }
    }
  };

  // Contact Message Handlers
  const handleMarkMessageRead = async (id) => {
    try {
      await contactMessageService.markAsRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' } : m));
      triggerAlert('Message marked as read.', 'success');
    } catch (e) {
      console.error(e);
      triggerAlert('Could not update message.', 'danger');
    }
  };

  const handleDeleteMessage = async (id) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await contactMessageService.delete(id);
        setMessages(prev => prev.filter(m => m.id !== id));
        triggerAlert('Message deleted.', 'success');
      } catch (e) {
        console.error(e);
        triggerAlert('Could not delete message.', 'danger');
      }
    }
  };

  // User Handlers
  const handleDeleteUser = async (id, email) => {
    const currentUser = getLocalStorageData('digilokam_user', null);
    if (currentUser && currentUser.id === id) {
      triggerAlert('You cannot delete your own account.', 'danger');
      return;
    }
    if (email === 'admin@digilokam.com') {
      triggerAlert('You cannot delete the primary admin account.', 'danger');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user ${email}?`)) {
      try {
        await userService.delete(id);
        setUsersList(prev => prev.filter(u => u.id !== id));
        triggerAlert('User deleted.', 'success');
      } catch (e) {
        console.error(e);
        triggerAlert('Could not delete user.', 'danger');
      }
    }
  };

  const handleUpdateUserRole = async (id, role, email) => {
    if (email === 'admin@digilokam.com') {
      triggerAlert('You cannot change the role of the primary admin.', 'danger');
      return;
    }
    try {
      await userService.updateRole(id, role);
      setUsersList(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      triggerAlert(`User role updated to ${role}.`, 'success');
    } catch (e) {
      console.error(e);
      triggerAlert('Could not update user role.', 'danger');
    }
  };

  // Site Settings Handler
  const handleSaveSiteSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('digilokam_site_settings', JSON.stringify(siteSettings));
    triggerAlert('General site configurations saved successfully!', 'success');
  };

  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("Selected file:", file);
    setUploadedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
    
    // Show instant local preview first
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Clear any existing URL value
    setArtImgUrl('');
    
    // Upload to Supabase Storage immediately
    setUploadingImage(true);
    storageService.uploadArticleImage(file)
      .then((publicUrl) => {
        console.log("Uploaded URL:", publicUrl);
        console.log("Saving image_url:", publicUrl);
        setArtImgUrl(publicUrl);
        setPreviewImage(publicUrl); // Sync preview to public URL
        setUploadSuccess(true);
        setUploadError(null);
        triggerAlert('Image uploaded successfully!', 'success');
      })
      .catch((err) => {
        console.error("Image upload failed:", err);
        setUploadError(err.message || 'Image upload failed');
        setUploadSuccess(false);
        triggerAlert('Image upload failed: ' + (err.message || 'Unknown error'), 'danger');
      })
      .finally(() => {
        setUploadingImage(false);
      });
  };

  const handleSourceTypeChange = (type) => {
    setImageSourceType(type);
    setPreviewImage('');
    setArtImgUrl('');
    setUploadedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleUrlChange = (val) => {
    setArtImgUrl(val);
    setPreviewImage(val);
  };

  // Forms state
  const [artTitle, setArtTitle] = useState('');
  const [artSlug, setArtSlug] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artDesc, setArtDesc] = useState('');
  const [artImgUrl, setArtImgUrl] = useState('');
  const [imageSourceType, setImageSourceType] = useState('upload'); // 'upload' or 'url'
  const [previewImage, setPreviewImage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [artCatId, setArtCatId] = useState('');
  const [artTags, setArtTags] = useState('');
  const [artIsFeatured, setArtIsFeatured] = useState(false);
  const [artIsDraft, setArtIsDraft] = useState(false);
  const [artSeoTitle, setArtSeoTitle] = useState('');
  const [artSeoDesc, setArtSeoDesc] = useState('');
  const [artReadTime, setArtReadTime] = useState('5 min read');
  const [artIsSponsored, setArtIsSponsored] = useState(false);
  const [artSponsorName, setArtSponsorName] = useState('');
  const [artSponsorLogo, setArtSponsorLogo] = useState('');
  const [internalLinks, setInternalLinks] = useState([]);
  const [monetizationSubTab, setMonetizationSubTab] = useState('adsense');
  const [affiliateLinks, setAffiliateLinks] = useState([]);
  const [editingLink, setEditingLink] = useState(null);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkSlug, setNewLinkSlug] = useState('');
  const [newLinkTargetUrl, setNewLinkTargetUrl] = useState('');

  const [stories, setStories] = useState([]);
  const [editingStory, setEditingStory] = useState(null);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyCoverUrl, setStoryCoverUrl] = useState('');
  const [storyPages, setStoryPages] = useState([{ image_url: '', text: '' }]);

  // Print required console logs
  console.log("Upload Mode Preview:", imageSourceType === 'upload' ? previewImage : '');
  console.log("URL Mode Preview:", imageSourceType === 'url' ? artImgUrl : '');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Generate slug helper
  const handleTitleChange = (val) => {
    setArtTitle(val);
    if (!editingArticle) {
      const slugVal = val
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      setArtSlug(slugVal || 'untitled-' + Date.now());
    }
  };

  // Open Editor for Creation
  const handleCreateNew = () => {
    setEditingArticle(null);
    setArtTitle('');
    setArtSlug('');
    setArtContent('');
    setArtDesc('');
    setArtImgUrl('');
    setPreviewImage('');
    setUploadedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setImageSourceType('upload');
    setArtCatId(categories[0]?.id || '');
    setArtTags('');
    setArtIsFeatured(false);
    setArtIsDraft(false);
    setArtSeoTitle('');
    setArtSeoDesc('');
    setArtReadTime('5 min read');
    setArtPublishedAt('');
    setArtIsSponsored(false);
    setArtSponsorName('');
    setArtSponsorLogo('');
    setShowEditorForm(true);
  };

  // Open Editor for Edit
  const handleEditClick = (art) => {
    setEditingArticle(art);
    setArtTitle(art.title);
    setArtSlug(art.slug);
    setArtContent(art.content);
    setArtDesc(art.description);
    setUploadedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    
    const isUploaded = art.image_url && art.image_url.includes('/article-images/');
    if (isUploaded) {
      setImageSourceType('upload');
      setPreviewImage(art.image_url || '');
      setArtImgUrl('');
      setUploadSuccess(true);
    } else {
      setImageSourceType('url');
      setArtImgUrl(art.image_url || '');
      setPreviewImage(art.image_url || '');
    }
    
    setArtCatId(art.category_id || '');
    setArtTags(art.tags ? art.tags.join(', ') : '');
    setArtIsFeatured(!!art.is_featured);
    setArtIsDraft(!!art.is_draft);
    setArtSeoTitle(art.seo_title || '');
    setArtSeoDesc(art.seo_description || '');
    setArtReadTime(art.read_time || '5 min read');
    setArtPublishedAt(art.published_at ? new Date(new Date(art.published_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
    setArtIsSponsored(!!art.is_sponsored);
    setArtSponsorName(art.sponsor_name || '');
    setArtSponsorLogo(art.sponsor_logo || '');
    setShowEditorForm(true);
  };

  // Save Article handler
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!artTitle.trim() || !artSlug.trim() || !artContent.trim() || !artDesc.trim()) {
      triggerAlert('Please fill out all required fields.', 'danger');
      return;
    }

    if (imageSourceType === 'upload') {
      if (uploadingImage) {
        triggerAlert('Please wait for the image upload to complete.', 'warning');
        return;
      }
      if (uploadError) {
        triggerAlert(`Cannot save article: ${uploadError}. Please select a valid file to upload.`, 'danger');
        return;
      }
      const hasUploadedImage = previewImage && !previewImage.startsWith('data:image');
      if (!hasUploadedImage && !editingArticle?.image_url) {
        triggerAlert('Please select and upload a valid featured image.', 'danger');
        return;
      }
    } else if (imageSourceType === 'url') {
      if (!artImgUrl.trim()) {
        triggerAlert('Please enter a valid image URL.', 'danger');
        return;
      }
    }

    const tagsArr = artTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const finalImageUrl = imageSourceType === 'upload'
      ? (uploadSuccess ? previewImage : (editingArticle?.image_url || ''))
      : artImgUrl;

    if (!finalImageUrl) {
      triggerAlert('Please provide a valid image.', 'danger');
      return;
    }

    console.log("Saving image_url:", finalImageUrl);

    const payload = {
      title: artTitle,
      slug: artSlug,
      content: artContent,
      description: artDesc,
      image_url: finalImageUrl,
      category_id: artCatId ? Number(artCatId) : null,
      tags: tagsArr,
      is_featured: artIsFeatured,
      is_draft: artIsDraft,
      seo_title: artSeoTitle || artTitle,
      seo_description: artSeoDesc || artDesc,
      read_time: artReadTime,
      published_at: artPublishedAt ? new Date(artPublishedAt).toISOString() : null,
      is_sponsored: artIsSponsored,
      sponsor_name: artSponsorName,
      sponsor_logo: artSponsorLogo
    };

    if (editingArticle) {
      payload.id = editingArticle.id;
    }

    console.log("Final image_url saved to database (payload):", payload.image_url);

    try {
      const saved = await articleService.save(payload);
      if (!saved || !saved.id) {
        throw new Error('Save operation returned an invalid or empty article record.');
      }
      
      console.log("Saved article from database has image_url:", saved.image_url);

      // Fetch fresh articles from Supabase to refresh the list and ensure UI model integrity
      const freshArticles = await articleService.getAll();
      setArticles(freshArticles);

      if (editingArticle) {
        triggerAlert('Article updated successfully!', 'success');
      } else {
        triggerAlert('New article added successfully!', 'success');
      }
      setCurrentRoute('admin/articles');
      setShowEditorForm(false);
    } catch (error) {
      console.error("Article save error:", error);
      triggerAlert(error.message || 'Error saving article', 'danger');
    }
  };

  // Delete Article handler
  const handleDeleteArticle = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await articleService.delete(id);
        setArticles((prev) => prev.filter((a) => a.id !== id));
        triggerAlert('Article deleted!', 'success');
      } catch (e) {
        console.error(e);
        triggerAlert('Could not delete article.', 'danger');
      }
    }
  };

  // Category CRUD Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !newCategorySlug.trim()) return;

    try {
      const saved = await categoryService.save({
        ...(editingCategory ? { id: editingCategory.id } : {}),
        name: newCategoryName,
        slug: newCategorySlug,
        description: newCategoryDesc
      });
      if (editingCategory) {
        setCategories((prev) => prev.map((c) => c.id === saved.id ? saved : c));
        setEditingCategory(null);
        triggerAlert('Category updated successfully!', 'success');
      } else {
        setCategories((prev) => [...prev, saved]);
        triggerAlert('Category added successfully!', 'success');
      }
      setNewCategoryName('');
      setNewCategorySlug('');
      setNewCategoryDesc('');
    } catch (e) {
      console.error(e);
      triggerAlert(editingCategory ? 'Could not update category.' : 'Could not add category.', 'danger');
      errorLogService.log(
        e.message || 'Error saving category',
        e.stack || '',
        'AdminDashboard'
      ).catch(console.error);
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategorySlug('');
    setNewCategoryDesc('');
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      // 1. Upload to Supabase Storage
      const publicUrl = await storageService.uploadArticleImage(file);
      // 2. Add to media database registry
      const newMedia = await mediaLibraryService.add({
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type
      });
      setMediaItems(prev => [newMedia, ...prev]);
      triggerAlert('Image uploaded and registered in Media Library!', 'success');
    } catch (err) {
      console.error(err);
      triggerAlert('Failed to upload media item: ' + (err.message || err), 'danger');
      errorLogService.log(
        err.message || 'Media upload error',
        err.stack || '',
        'AdminDashboard'
      ).catch(console.error);
    } finally {
      setUploadingMedia(false);
      e.target.value = ''; // clear input
    }
  };

  const handleDeleteMedia = async (id) => {
    if (window.confirm('Are you sure you want to delete this media file? It might be in use in some articles.')) {
      try {
        await mediaLibraryService.delete(id);
        setMediaItems(prev => prev.filter(m => m.id !== id));
        triggerAlert('Media file deleted successfully!', 'success');
      } catch (err) {
        console.error(err);
        triggerAlert('Failed to delete media item.', 'danger');
      }
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastBody.trim()) return;
    if (subscribers.length === 0) {
      triggerAlert('No subscribers available to broadcast to.', 'danger');
      return;
    }

    setSendingBroadcast(true);
    try {
      const saved = await campaignService.add({
        subject: broadcastSubject,
        body: broadcastBody,
        sent_to: subscribers.length
      });
      setCampaigns((prev) => [saved, ...prev]);
      setBroadcastSubject('');
      setBroadcastBody('');
      triggerAlert(`Broadcast successfully sent to ${subscribers.length} subscribers!`, 'success');
    } catch (e) {
      console.error(e);
      triggerAlert('Failed to send newsletter broadcast.', 'danger');
      errorLogService.log(
        e.message || 'Error sending newsletter broadcast',
        e.stack || '',
        'AdminDashboard'
      ).catch(console.error);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleSeoAnalysis = () => {
    const kw = focusKeyword.trim().toLowerCase();
    if (!kw) {
      triggerAlert('Please enter a target focus keyword first.', 'warning');
      return;
    }

    const title = artTitle.toLowerCase();
    const desc = artDesc.toLowerCase();
    const content = artContent.toLowerCase();

    // 1. Title check
    const inTitle = title.includes(kw);
    // 2. Desc check
    const inDesc = desc.includes(kw);
    // 3. Word count
    const words = artContent.trim().split(/\s+/).filter(Boolean).length;
    const lengthOk = words >= 300;
    // 4. Density
    let density = 0;
    if (words > 0) {
      const occurrences = content.split(kw).length - 1;
      density = ((occurrences * kw.split(/\s+/).length) / words) * 100;
    }

    // Calculate score
    let score = 0;
    if (inTitle) score += 30;
    if (inDesc) score += 20;
    if (lengthOk) score += 20;
    if (density >= 1 && density <= 2.5) score += 30;
    else if (density > 0) score += 15;

    // Readability
    const sentences = artContent.split(/[.!?]+/).filter(Boolean).length;
    const avgSentenceLength = sentences > 0 ? words / sentences : 0;
    let readability = 'Standard';
    if (avgSentenceLength <= 12) readability = 'Very Easy';
    else if (avgSentenceLength <= 18) readability = 'Easy';
    else if (avgSentenceLength > 28) readability = 'Very Hard';
    else if (avgSentenceLength > 22) readability = 'Hard';

    setSeoAnalysis({
      score,
      inTitle,
      inDesc,
      lengthOk,
      words,
      density: density.toFixed(2),
      readability
    });

    // Generate Tag Suggestions: simple frequency count
    const stopWords = new Set(['the', 'and', 'a', 'of', 'to', 'in', 'is', 'that', 'it', 'for', 'on', 'with', 'as', 'this', 'are', 'was', 'by', 'an', 'be', 'at', 'or', 'from', 'your', 'with']);
    const cleanWords = content.replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    const wordFreq = {};
    cleanWords.forEach(w => {
      if (w.length > 4 && !stopWords.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });
    const sortedWords = Object.keys(wordFreq).sort((a, b) => wordFreq[b] - wordFreq[a]);
    setAiTags(sortedWords.slice(0, 5));
    setTimeout(() => {
      scanInternalLinks();
    }, 50);
    triggerAlert('SEO analysis and suggestions generated!', 'success');
  };

  const scanInternalLinks = () => {
    if (!artContent) {
      setInternalLinks([]);
      return;
    }
    const suggestions = [];
    articles.forEach(art => {
      if (editingArticle && art.id === editingArticle.id) return;
      
      const titleWord = art.title.replace(/[^a-zA-Z0-9\s\u0d00-\u0d7f]/g, '');
      const wordsToSearch = [art.slug.replace(/-/g, ' '), titleWord];
      
      wordsToSearch.forEach(word => {
        if (word.length > 3 && artContent.toLowerCase().includes(word.toLowerCase())) {
          const linkPattern = new RegExp(`\\[[^\\]]*\\]\\([^\\)]*${art.slug}[^\\)]*\\)`, 'i');
          if (!linkPattern.test(artContent)) {
            suggestions.push({
              article: art,
              keyword: word,
              suggestedText: `[${word}](/article/${art.slug})`
            });
          }
        }
      });
    });
    const uniqueSuggestions = suggestions.filter((v, i, a) => a.findIndex(t => t.article.id === v.article.id) === i);
    setInternalLinks(uniqueSuggestions);
  };

  const applyInternalLink = (keyword, slug) => {
    const regex = new RegExp(`(${keyword})`, 'i');
    const newContent = artContent.replace(regex, `[$1](/article/${slug})`);
    setArtContent(newContent);
    triggerAlert(`Internal link created for "${keyword}"!`, 'success');
    setTimeout(() => {
      scanInternalLinks();
    }, 100);
  };

  const handleGenerateSummary = () => {
    if (!artContent.trim()) {
      triggerAlert('Content is empty. Add content to generate a summary.', 'warning');
      return;
    }
    setGeneratingSummary(true);
    setTimeout(() => {
      const plainText = artContent.replace(/##+/g, '').replace(/\*\*|__/g, '').trim();
      const sentences = plainText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
      const summary = sentences.slice(0, 3).join('. ') + '.';
      setArtDesc(summary);
      setGeneratingSummary(false);
      triggerAlert('Excerpt generated from content using AI summary tools!', 'success');
    }, 800);
  };

  const handleExtendContent = () => {
    if (!focusKeyword.trim()) {
      triggerAlert('Specify a Focus Keyword for the AI to expand on.', 'warning');
      return;
    }
    setExtendingContent(true);
    setTimeout(() => {
      const extension = `\n\n## Understanding ${focusKeyword}\n\nTo expand further on ${focusKeyword}, it is vital to explore how technology continuously shifts paradigms. Incorporating efficient practices surrounding ${focusKeyword} helps creators and developers maximize utility. By addressing key factors like optimization, scalability, and user feedback, implementations can ensure long-term stability and high user engagement.`;
      setArtContent(prev => prev + extension);
      setExtendingContent(false);
      triggerAlert('AI content extension appended successfully!', 'success');
    }, 1000);
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? Articles under this category will have their category cleared.')) {
      try {
        await categoryService.delete(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        triggerAlert('Category deleted!', 'success');
      } catch (e) {
        console.error(e);
        triggerAlert('Could not delete category.', 'danger');
      }
    }
  };

  // Save Ads Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await settingsService.save(localSettings);
      setSettings(localSettings);
      triggerAlert('Settings successfully saved!', 'success');
    } catch (e) {
      console.error(e);
      triggerAlert('Could not save settings.', 'danger');
    }
  };

  // Sitemap Generation XML string
  const generateSitemapXml = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    xml += `  <url>\n    <loc>https://digilokam.com/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>https://digilokam.com/about</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>https://digilokam.com/contact</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>https://digilokam.com/privacy</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;

    categories.forEach((cat) => {
      xml += `  <url>\n    <loc>https://digilokam.com/category/${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    articles.forEach((art) => {
      xml += `  <url>\n    <loc>https://digilokam.com/article/${art.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;
  };

  const handleDownloadSitemap = () => {
    const xml = generateSitemapXml();
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerAlert = (msg, type) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSaveAffiliateLink = async (e) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkSlug || !newLinkTargetUrl) return;
    
    try {
      const payload = {
        title: newLinkTitle,
        slug: newLinkSlug,
        target_url: newLinkTargetUrl
      };
      if (editingLink) {
        payload.id = editingLink.id;
      }
      
      const saved = await affiliateService.save(payload);
      if (editingLink) {
        setAffiliateLinks(prev => prev.map(l => l.id === saved.id ? saved : l));
        triggerAlert('Affiliate link updated!', 'success');
      } else {
        setAffiliateLinks(prev => [saved, ...prev]);
        triggerAlert('Affiliate link created!', 'success');
      }
      
      // Reset form
      setEditingLink(null);
      setNewLinkTitle('');
      setNewLinkSlug('');
      setNewLinkTargetUrl('');
    } catch (err) {
      console.error(err);
      triggerAlert('Failed to save affiliate link.', 'danger');
    }
  };

  const handleEditAffiliateLink = (link) => {
    setEditingLink(link);
    setNewLinkTitle(link.title);
    setNewLinkSlug(link.slug);
    setNewLinkTargetUrl(link.target_url);
  };

  const handleDeleteAffiliateLink = async (id) => {
    if (!window.confirm('Are you sure you want to delete this affiliate link?')) return;
    try {
      await affiliateService.delete(id);
      setAffiliateLinks(prev => prev.filter(l => l.id !== id));
      triggerAlert('Affiliate link deleted.', 'success');
    } catch (err) {
      console.error(err);
      triggerAlert('Failed to delete affiliate link.', 'danger');
    }
  };

  const handleAddStoryPage = () => {
    setStoryPages([...storyPages, { image_url: '', text: '' }]);
  };

  const handleRemoveStoryPage = (idx) => {
    setStoryPages(storyPages.filter((_, i) => i !== idx));
  };

  const handleStoryPageChange = (idx, field, val) => {
    const updated = storyPages.map((page, i) => {
      if (i === idx) return { ...page, [field]: val };
      return page;
    });
    setStoryPages(updated);
  };

  const handleSaveStory = async (e) => {
    e.preventDefault();
    if (!storyTitle || !storyCoverUrl) return;

    try {
      const payload = {
        title: storyTitle,
        cover_url: storyCoverUrl,
        pages: storyPages
      };
      if (editingStory) {
        payload.id = editingStory.id;
      }

      const saved = await webStoryService.save(payload);
      if (editingStory) {
        setStories(prev => prev.map(s => s.id === saved.id ? saved : s));
        triggerAlert('Web Story updated successfully!', 'success');
      } else {
        setStories(prev => [saved, ...prev]);
        triggerAlert('New Web Story created successfully!', 'success');
      }

      // Reset Form
      setEditingStory(null);
      setStoryTitle('');
      setStoryCoverUrl('');
      setStoryPages([{ image_url: '', text: '' }]);
    } catch (err) {
      console.error(err);
      triggerAlert('Failed to save Web Story.', 'danger');
    }
  };

  const handleEditStory = (story) => {
    setEditingStory(story);
    setStoryTitle(story.title);
    setStoryCoverUrl(story.cover_url);
    setStoryPages(story.pages || [{ image_url: '', text: '' }]);
  };

  const handleDeleteStory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Web Story?')) return;
    try {
      await webStoryService.delete(id);
      setStories(prev => prev.filter(s => s.id !== id));
      triggerAlert('Web Story deleted.', 'success');
    } catch (err) {
      console.error(err);
      triggerAlert('Failed to delete Web Story.', 'danger');
    }
  };

  return (
    <div className="admin-layout-container anim-fade-in">
      {/* Admin Sidebar Navigation */}
      <aside className="admin-sidebar">
        <h3 style={{ fontSize: '0.9rem', fontWeight: '800', padding: '8px 14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Admin Panel
        </h3>
        
        <button
          onClick={() => { setCurrentRoute('admin/dashboard'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </button>
        
        <button
          onClick={() => { setCurrentRoute('admin/articles'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'articles' ? 'active' : ''}`}
        >
          <FileText size={16} />
          Articles
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/categories'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
        >
          <Tag size={16} />
          Categories
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/comments'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
        >
          <MessageSquare size={16} />
          Comments
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/subscribers'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'subscribers' ? 'active' : ''}`}
        >
          <Users size={16} />
          Subscribers
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/messages'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
        >
          <Mail size={16} />
          Contact Messages
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/users'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          <Users size={16} />
          Users
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/monetization'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'monetization' ? 'active' : ''}`}
        >
          <DollarSign size={16} />
          Ads & Monetization
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/sitemap'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'sitemap' ? 'active' : ''}`}
        >
          <Download size={16} />
          Sitemap XML
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/settings'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings size={16} />
          Settings
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/logs'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
        >
          <AlertCircle size={16} />
          System Logs
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/media'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'media' ? 'active' : ''}`}
        >
          <Image size={16} />
          Media Library
        </button>

        <button
          onClick={() => { setCurrentRoute('admin/stories'); setShowEditorForm(false); }}
          className={`admin-tab-btn ${activeTab === 'stories' ? 'active' : ''}`}
        >
          <BookOpen size={16} />
          Web Stories
        </button>
      </aside>

      {/* Main Admin Content Pane */}
      <main className="admin-content-pane" style={{ position: 'relative' }}>
        {/* Admin Header / Top Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DigiLokam Admin</span>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '2px 0 0 0', textTransform: 'capitalize' }}>
              {activeTab === 'logs' ? 'System Logs' : activeTab === 'media' ? 'Media Library' : activeTab.replace('-', ' ')}
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '8px',
                  color: 'var(--text-secondary)'
                }}
              >
                <Bell size={20} />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--danger)'
                  }} />
                )}
              </button>
              
              {showNotifDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  width: '320px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  padding: '12px 0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 8px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Notifications</span>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button onClick={handleMarkAllNotifsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No notifications.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: notif.is_read ? 'transparent' : 'rgba(37, 99, 235, 0.03)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '8px',
                          textAlign: 'left'
                        }}>
                          <div style={{ flexGrow: 1 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: notif.is_read ? '500' : '700' }}>{notif.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>{notif.message}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {!notif.is_read && (
                              <button onClick={() => handleMarkNotifRead(notif.id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', cursor: 'pointer' }}>
                                Read
                              </button>
                            )}
                            <button onClick={() => handleDeleteNotif(notif.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.7rem', cursor: 'pointer' }}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setCurrentRoute('home')}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              View Site
            </button>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
        {loadingCms ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading dashboard data from Supabase...</p>
          </div>
        ) : cmsError ? (
          <div className="alert alert-danger" style={{ margin: '20px 0', padding: '24px', borderRadius: 'var(--radius-md)', borderLeft: '5px solid #ef4444' }}>
            <h4 style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#b91c1c' }}>Failed to Load Dashboard Data</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b' }}>{cmsError}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '16px', fontSize: '0.8rem', padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* Tab 0: Dashboard Overview Panel */}
            {activeTab === 'dashboard' && (
          <div className="anim-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 className="pane-title" style={{ marginBottom: '8px' }}>Dashboard Overview</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome to the DigiLokam administration control center.</p>
            </div>

            {comments.filter(c => c.status === 'pending').length > 0 && (
              <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 'var(--radius-md)', padding: '16px 20px', borderLeft: '5px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.9rem', color: '#b45309' }}>
                    <strong>New Comments Pending Moderation:</strong> You have <strong>{comments.filter(c => c.status === 'pending').length}</strong> pending comment(s) waiting for approval.
                  </span>
                </div>
                <button onClick={() => setCurrentRoute('admin/comments')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'auto', backgroundColor: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  Moderate Comments
                </button>
              </div>
            )}
            
            {/* Quick Stats Grid - 10 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.2' }}>{articles.length}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Total Articles</div>
              </div>

              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', lineHeight: '1.2' }}>{articles.filter(a => !a.is_draft).length}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Published Articles</div>
              </div>

              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b', lineHeight: '1.2' }}>{articles.filter(a => a.is_draft).length}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Draft Articles</div>
              </div>

              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--secondary)', lineHeight: '1.2' }}>{categories.length}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Total Categories</div>
              </div>

              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#3b82f6', lineHeight: '1.2' }}>{comments.length}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Total Comments</div>
              </div>

              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444', lineHeight: '1.2' }}>{comments.filter(c => c.status === 'pending').length}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Pending Comments</div>
              </div>

              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', lineHeight: '1.2' }}>{comments.filter(c => c.status === 'approved').length}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Approved Comments</div>
              </div>

              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#8b5cf6', lineHeight: '1.2' }}>{subscribers.length}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Total Subscribers</div>
              </div>

              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ec4899', lineHeight: '1.2' }}>{articles.reduce((sum, a) => sum + (a.views || 0), 0)}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Total Views</div>
              </div>

              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#6366f1', lineHeight: '1.2' }}>{usersList.length}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Registered Users</div>
              </div>

              <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#06b6d4', lineHeight: '1.2' }}>{messages.length}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Total Messages</div>
              </div>
            </div>

            {/* Analytics Performance Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', margin: '12px 0' }} className="grid-responsive-split">
              {/* Chart 1: Top Articles by Views */}
              <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px' }}>Top Articles by Views</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {articles.slice().sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((art, idx) => {
                    const maxViews = Math.max(...articles.map(a => a.views || 0), 1);
                    const pct = ((art.views || 0) / maxViews) * 100;
                    return (
                      <div key={art.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                            {idx + 1}. {art.title}
                          </span>
                          <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{art.views || 0} views</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Category Distribution */}
              <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px' }}>Category Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {categories.map((cat) => {
                    const count = articles.filter(a => a.category_id === cat.id).length;
                    const maxCount = Math.max(...categories.map(c => articles.filter(a => a.category_id === c.id).length), 1);
                    const pct = (count / maxCount) * 100;
                    return (
                      <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '600' }}>{cat.name}</span>
                          <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{count} articles</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--secondary)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 3: Weekly Subscriber Growth */}
              <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px' }}>Weekly Subscriber Registrations</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '160px', padding: '10px 20px', borderBottom: '1px solid var(--border-color)', gap: '10px' }}>
                  {(() => {
                    const data = [];
                    for (let i = 6; i >= 0; i--) {
                      const date = new Date();
                      date.setDate(date.getDate() - i);
                      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      const count = subscribers.filter(s => {
                        const subDate = new Date(s.subscribed_at || s.created_at);
                        return subDate.toDateString() === date.toDateString();
                      }).length;
                      data.push({ label: dateStr, value: count });
                    }
                    const maxSubVal = Math.max(...data.map(d => d.value), 1);
                    return data.map((d, i) => {
                      const heightPct = (d.value / maxSubVal) * 80 + 10;
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{d.value}</span>
                          <div style={{
                            width: '100%',
                            maxWidth: '40px',
                            height: `${heightPct}%`,
                            backgroundColor: 'rgba(37, 99, 235, 0.15)',
                            border: '1.5px solid var(--primary)',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease'
                          }} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{d.label}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Layout Split: Quick Actions + Inbox/Subscribers vs Activity Feed */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              {/* Left Column: Actions and Sub-views */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Quick Actions Card */}
                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '8px' }}>Quick Actions</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button onClick={() => { setCurrentRoute('admin/articles'); handleCreateNew(); }} className="btn btn-primary" style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '10px 4px' }}>
                      <Plus size={14} />
                      <span>Write Article</span>
                    </button>
                    <button onClick={() => setCurrentRoute('admin/comments')} className="btn btn-secondary" style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '10px 4px' }}>
                      <MessageSquare size={14} />
                      <span>Moderate Comments</span>
                    </button>
                    <button onClick={() => setCurrentRoute('admin/subscribers')} className="btn btn-secondary" style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '10px 4px' }}>
                      <Users size={14} />
                      <span>Newsletter Lists</span>
                    </button>
                    <button onClick={() => setCurrentRoute('admin/messages')} className="btn btn-secondary" style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '10px 4px' }}>
                      <Mail size={14} />
                      <span>Contact Messages</span>
                    </button>
                  </div>
                </div>

                {/* Inbox & Subscribers Preview Card */}
                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={18} />
                    <span>Inbox & Subscribers</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Unread Messages ({messages.filter(m => m.status === 'unread').length})</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setCurrentRoute('admin/messages')}>View All</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {messages.filter(m => m.status === 'unread').length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No unread messages.</p>
                        ) : (
                          messages.filter(m => m.status === 'unread').slice(0, 2).map(msg => (
                            <div key={msg.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--bg-primary)', borderRadius: '6px', borderLeft: '3px solid var(--primary)', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{msg.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{msg.subject}</span>
                              </div>
                              <button onClick={() => { handleMarkMessageRead(msg.id); }} className="btn btn-outline" style={{ padding: '2px 6px', fontSize: '0.65rem', borderRadius: '4px', height: 'fit-content' }}>
                                Mark Read
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }}></div>

                    <div>
                      <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Latest Subscribers</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setCurrentRoute('admin/subscribers')}>View All</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {subscribers.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No subscribers yet.</p>
                        ) : (
                          subscribers.slice(0, 3).map(sub => (
                            <div key={sub.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                              <span style={{ fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={sub.email}>
                                {sub.email}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {new Date(sub.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Activity Feed */}
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '4px' }}>Recent Activity Feed</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Live chronological updates across your CMS platforms.</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {[
                    ...articles.map(art => ({
                      id: art.id,
                      type: art.is_draft ? 'draft' : 'article',
                      title: art.is_draft ? `New draft created: "${art.title}"` : `New article published: "${art.title}"`,
                      date: new Date(art.published_at || art.created_at),
                      icon: <FileText size={14} />,
                      color: art.is_draft ? '#f59e0b' : '#3b82f6',
                      bg: art.is_draft ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)'
                    })),
                    ...comments.map(comm => ({
                      id: comm.id,
                      type: 'comment',
                      title: `Comment from "${comm.author_name}" status updated to "${comm.status || 'pending'}"`,
                      date: new Date(comm.created_at),
                      icon: <MessageSquare size={14} />,
                      color: comm.status === 'approved' ? '#10b981' : comm.status === 'rejected' ? '#ef4444' : '#f59e0b',
                      bg: comm.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : comm.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                    })),
                    ...subscribers.map(sub => ({
                      id: sub.id,
                      type: 'subscriber',
                      title: `New reader subscribed: ${sub.email}`,
                      date: new Date(sub.subscribed_at),
                      icon: <Users size={14} />,
                      color: '#8b5cf6',
                      bg: 'rgba(139, 92, 246, 0.1)'
                    })),
                    ...messages.map(msg => ({
                      id: msg.id,
                      type: 'message',
                      title: `Contact message from "${msg.name}": "${msg.subject}"`,
                      date: new Date(msg.created_at),
                      icon: <Mail size={14} />,
                      color: msg.status === 'unread' ? '#3b82f6' : '#6b7280',
                      bg: msg.status === 'unread' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)'
                    }))
                  ]
                  .sort((a, b) => b.date - a.date)
                  .slice(0, 8)
                  .map((act, index) => (
                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: index < 7 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{ 
                        color: act.color, 
                        backgroundColor: act.bg,
                        padding: '8px', 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {act.icon}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          {act.title}
                        </span>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {act.date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 1: Articles Panel */}
        {activeTab === 'articles' && (
          <div>
            {!showEditorForm ? (
              <>
                <div className="pane-header">
                  <h2 className="pane-title">Manage Articles</h2>
                  <button onClick={handleCreateNew} className="btn btn-primary">
                    <Plus size={16} />
                    <span>New Article</span>
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Views</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((art) => (
                        <tr key={art.id}>
                          <td style={{ fontWeight: '600', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {art.title}
                          </td>
                          <td>
                            {categories.find((c) => String(c.id) === String(art.category_id))?.name || 'Uncategorized'}
                          </td>
                          <td>
                            {art.is_draft ? (
                              <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Draft</span>
                            ) : art.published_at && new Date(art.published_at) > new Date() ? (
                              <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>Scheduled</span>
                            ) : (
                              <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Published</span>
                            )}
                          </td>
                          <td>{art.views || 0}</td>
                          <td>{new Date(art.published_at || art.created_at).toLocaleDateString('en-US')}</td>
                          <td className="admin-actions-cell">
                            <button
                              onClick={() => handleEditClick(art)}
                              className="action-icon-btn action-edit"
                              title="Edit Article"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(art.id)}
                              className="action-icon-btn action-delete"
                              title="Delete Article"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              // Add / Edit Article Form
              <div>
                <div className="pane-header">
                  <h2 className="pane-title">{editingArticle ? 'Edit Article' : 'Write New Article'}</h2>
                  <button onClick={() => setShowEditorForm(false)} className="btn btn-secondary">
                    Back
                  </button>
                </div>

                <form onSubmit={handleSaveArticle} className="admin-form-editor">
                  <div className="admin-form-row">
                    <div>
                      <label className="form-label">Article Title (Title)*</label>
                      <input
                        type="text"
                        value={artTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="form-control"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">URL Slug*</label>
                      <input
                        type="text"
                        value={artSlug}
                        onChange={(e) => setArtSlug(e.target.value)}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div>
                      <label className="form-label">Category*</label>
                      <select
                        value={artCatId}
                        onChange={(e) => setArtCatId(e.target.value)}
                        className="form-control"
                        required
                      >
                        <option value="">-- Select Category --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Read Time (e.g. '5 min read')</label>
                      <input
                        type="text"
                        value={artReadTime}
                        onChange={(e) => setArtReadTime(e.target.value)}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div>
                      <label className="form-label">Schedule Publication Date & Time (Leave blank for immediate publish)</label>
                      <input
                        type="datetime-local"
                        value={artPublishedAt}
                        onChange={(e) => setArtPublishedAt(e.target.value)}
                        className="form-control"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        If scheduled in the future, the article will remain hidden on the public site until the scheduled time.
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: 'bold' }}>Featured Image</h4>
                    
                    {/* Radio Options Toggle */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                        <input
                          type="radio"
                          name="imageSourceType"
                          checked={imageSourceType === 'upload'}
                          onChange={() => handleSourceTypeChange('upload')}
                          style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <span>Upload Image</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                        <input
                          type="radio"
                          name="imageSourceType"
                          checked={imageSourceType === 'url'}
                          onChange={() => handleSourceTypeChange('url')}
                          style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <span>Use Image URL</span>
                      </label>
                    </div>

                    {/* File Upload Control Section */}
                    <div style={{ marginBottom: '16px', opacity: imageSourceType === 'upload' ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Upload Image File</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="form-control"
                          style={{ padding: '6px 12px', backgroundColor: 'var(--bg-primary)' }}
                          disabled={imageSourceType !== 'upload' || uploadingImage}
                        />
                        {uploadingImage && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>Uploading...</span>}
                      </div>
                      
                      {/* Upload Image Preview (only in upload mode) */}
                      {imageSourceType === 'upload' && previewImage && (
                        <div style={{ marginTop: '12px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Uploaded Image Preview:</span>
                          <img 
                            src={previewImage} 
                            alt="Uploaded Image Preview" 
                            style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
                          />
                        </div>
                      )}
                    </div>

                    {/* Image URL Control Section */}
                    <div style={{ opacity: imageSourceType === 'url' ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Image URL</label>
                      <input
                        type="text"
                        placeholder="https://example.com/image.jpg"
                        value={artImgUrl}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        className="form-control"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                        disabled={imageSourceType !== 'url'}
                      />
                      
                      {/* URL Image Preview (only in URL mode) */}
                      {imageSourceType === 'url' && previewImage && (
                        <div style={{ marginTop: '12px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>URL Image Preview:</span>
                          <img 
                            src={previewImage} 
                            alt="URL Image Preview" 
                            style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Short Excerpt (Card Summary)*</label>
                    <textarea
                      value={artDesc}
                      onChange={(e) => setArtDesc(e.target.value)}
                      className="form-control"
                      style={{ minHeight: '60px' }}
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label className="form-label">Full Article Content (Supports Heading Markdown)*</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Use '## Heading' for main titles and '### Subheading' for subheaders.
                    </p>
                    <textarea
                      value={artContent}
                      onChange={(e) => setArtContent(e.target.value)}
                      className="form-control"
                      style={{ minHeight: '300px', fontFamily: 'monospace' }}
                      required
                    ></textarea>
                  </div>

                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '16px', fontWeight: 'bold' }}>SEO Meta Configurations (Optional)</h4>
                    <div className="admin-form-row">
                      <div>
                        <label className="form-label">SEO Meta Title</label>
                        <input
                          type="text"
                          value={artSeoTitle}
                          onChange={(e) => setArtSeoTitle(e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <div>
                        <label className="form-label">SEO Meta Description</label>
                        <input
                          type="text"
                          value={artSeoDesc}
                          onChange={(e) => setArtSeoDesc(e.target.value)}
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI & SEO Assistant Section */}
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.02) 0%, rgba(124, 58, 237, 0.05) 100%)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <Brain size={18} style={{ color: 'var(--primary)' }} />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>AI SEO & Content Assistant</h4>
                    </div>

                    <div className="admin-form-row">
                      <div>
                        <label className="form-label">Focus Keyword</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="e.g. artificial intelligence"
                            value={focusKeyword}
                            onChange={(e) => setFocusKeyword(e.target.value)}
                            className="form-control"
                            style={{ backgroundColor: 'var(--bg-primary)' }}
                          />
                          <button
                            type="button"
                            onClick={handleSeoAnalysis}
                            className="btn btn-secondary"
                            style={{ flexShrink: 0 }}
                          >
                            Analyze SEO
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={handleGenerateSummary}
                          className="btn btn-outline"
                          style={{ flexGrow: 1, height: '42px' }}
                          disabled={generatingSummary}
                        >
                          {generatingSummary ? 'Summarizing...' : 'AI Extract Excerpt'}
                        </button>
                        <button
                          type="button"
                          onClick={handleExtendContent}
                          className="btn btn-outline"
                          style={{ flexGrow: 1, height: '42px' }}
                          disabled={extendingContent}
                        >
                          {extendingContent ? 'Expanding...' : 'AI Expand Content'}
                        </button>
                      </div>
                    </div>

                    {seoAnalysis && (
                      <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>SEO Optimization Score:</span>
                          <span style={{ 
                            fontSize: '1rem', 
                            fontWeight: '800', 
                            color: seoAnalysis.score >= 80 ? 'var(--success)' : seoAnalysis.score >= 50 ? '#f59e0b' : 'var(--danger)',
                            padding: '4px 12px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '4px'
                          }}>{seoAnalysis.score} / 100</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.8rem' }} className="grid-responsive-2">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {seoAnalysis.inTitle ? <Check size={14} style={{ color: 'var(--success)' }} /> : <X size={14} style={{ color: 'var(--danger)' }} />}
                            <span>Keyword in Title</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {seoAnalysis.inDesc ? <Check size={14} style={{ color: 'var(--success)' }} /> : <X size={14} style={{ color: 'var(--danger)' }} />}
                            <span>Keyword in Excerpt</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {seoAnalysis.lengthOk ? <Check size={14} style={{ color: 'var(--success)' }} /> : <X size={14} style={{ color: 'var(--danger)' }} />}
                            <span>Length: {seoAnalysis.words} words</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Density: <strong>{seoAnalysis.density}%</strong> (Ideal: 1-2.5%)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
                            <span>Readability Level: <strong style={{ color: 'var(--primary)' }}>{seoAnalysis.readability}</strong></span>
                          </div>
                        </div>

                        {aiTags.length > 0 && (
                          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>AI Suggested Tags (Click to append):</span>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {aiTags.map((t, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const currentTags = artTags ? artTags.split(',').map(x => x.trim()).filter(Boolean) : [];
                                    if (!currentTags.includes(t)) {
                                      currentTags.push(t);
                                      setArtTags(currentTags.join(', '));
                                      triggerAlert(`Tag "${t}" appended!`, 'success');
                                    }
                                  }}
                                  className="tag-btn"
                                  style={{ border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.7rem', padding: '4px 8px', cursor: 'pointer', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                                >
                                  #{t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {internalLinks.length > 0 && (
                          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>SEO Internal Link Suggestions:</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {internalLinks.map((sug, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid var(--border-color)', textAlign: 'left' }}>
                                  <span>Keyword <strong>"{sug.keyword}"</strong> can link to <strong>{sug.article.title}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => applyInternalLink(sug.keyword, sug.article.slug)}
                                    className="btn btn-primary"
                                    style={{ padding: '4px 8px', fontSize: '0.65rem', height: 'auto' }}
                                  >
                                    Auto Link
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={artIsFeatured}
                          onChange={(e) => setArtIsFeatured(e.target.checked)}
                        />
                        <span>Show on Featured Slider (Featured Article)</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={artIsDraft}
                          onChange={(e) => setArtIsDraft(e.target.checked)}
                        />
                        <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Save as Draft (Unpublished)</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={artIsSponsored}
                          onChange={(e) => setArtIsSponsored(e.target.checked)}
                        />
                        <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Sponsored Content</span>
                      </label>
                    </div>

                    {artIsSponsored && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0', padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'left' }}>
                        <div>
                          <label className="form-label">Sponsor Name</label>
                          <input
                            type="text"
                            value={artSponsorName}
                            onChange={(e) => setArtSponsorName(e.target.value)}
                            className="form-control"
                            placeholder="e.g. Google India"
                          />
                        </div>
                        <div>
                          <label className="form-label">Sponsor Logo URL</label>
                          <input
                            type="text"
                            value={artSponsorLogo}
                            onChange={(e) => setArtSponsorLogo(e.target.value)}
                            className="form-control"
                            placeholder="https://example.com/logo.jpg"
                          />
                        </div>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary">
                      <Save size={16} />
                      <span>Save Article</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Categories Panel */}
        {activeTab === 'categories' && (
          <div>
            <div className="pane-header">
              <h2 className="pane-title">Manage Categories</h2>
            </div>

            <div className="grid-responsive-split">
              {/* Left Column: Create Form */}
              <form onSubmit={handleAddCategory} className="admin-form-editor">
                <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                
                <div>
                  <label className="form-label">Category Name (Name)*</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      if (!editingCategory) {
                        setNewCategorySlug(e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'));
                      }
                    }}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">URL Slug*</label>
                  <input
                    type="text"
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    className="form-control"
                    style={{ minHeight: '80px' }}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
                    {editingCategory ? <Save size={16} /> : <Plus size={16} />}
                    <span>{editingCategory ? 'Update Category' : 'Add Category'}</span>
                  </button>
                  {editingCategory && (
                    <button type="button" onClick={handleCancelCategoryEdit} className="btn btn-secondary" style={{ width: 'fit-content' }}>
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </form>

              {/* Right Column: Categories List Table */}
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Slug</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: '600' }}>{c.name}</td>
                        <td>{c.slug}</td>
                        <td className="admin-actions-cell" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(c);
                                setNewCategoryName(c.name);
                                setNewCategorySlug(c.slug);
                                setNewCategoryDesc(c.description || '');
                              }}
                              className="action-icon-btn action-edit"
                              title="Edit Category"
                              style={{ color: 'var(--primary)' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(c.id)}
                              className="action-icon-btn action-delete"
                              title="Delete Category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Monetize Settings Panel */}
        {activeTab === 'monetization' && (
          <div>
            <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="pane-title">Monetization Hub</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setMonetizationSubTab('adsense')}
                  className={`btn ${monetizationSubTab === 'adsense' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', height: 'auto' }}
                >
                  Google AdSense
                </button>
                <button
                  type="button"
                  onClick={() => setMonetizationSubTab('affiliates')}
                  className={`btn ${monetizationSubTab === 'affiliates' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', height: 'auto' }}
                >
                  Affiliate Link Registry
                </button>
                <button
                  type="button"
                  onClick={() => setMonetizationSubTab('dashboard')}
                  className={`btn ${monetizationSubTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', height: 'auto' }}
                >
                  Earnings Dashboard
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Google AdSense Form */}
            {monetizationSubTab === 'adsense' && (
              <form onSubmit={handleSaveSettings} className="admin-form-editor">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Google AdSense Publisher Client ID</label>
                    <input
                      type="text"
                      value={localSettings.adsenseClientId || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, adsenseClientId: e.target.value })}
                      className="form-control"
                      placeholder="e.g. ca-pub-XXXXXXXXXXXXXXXX"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '10px 0' }}>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={!!localSettings.showBannerAds}
                        onChange={(e) => setLocalSettings({ ...localSettings, showBannerAds: e.target.checked })}
                      />
                      <span>Show Horizontal Header Ad Banner (Header Horizontal Ad)</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={!!localSettings.showSidebarAds}
                        onChange={(e) => setLocalSettings({ ...localSettings, showSidebarAds: e.target.checked })}
                      />
                      <span>Show Sidebar Ad Banner (Sidebar 300x250 Ad)</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={!!localSettings.showInArticleAds}
                        onChange={(e) => setLocalSettings({ ...localSettings, showInArticleAds: e.target.checked })}
                      />
                      <span>Show In-Article Ad Banner (In-article Ads)</span>
                    </label>
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '10px 0' }}></div>

                  <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Affiliate Product Recommendation</h3>
                  
                  <div className="admin-form-row">
                    <div>
                      <label className="form-label">Affiliate Product Tagline</label>
                      <input
                        type="text"
                        value={localSettings.affiliateText1 || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, affiliateText1: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label className="form-label">Affiliate Direct Link (URL)</label>
                      <input
                        type="url"
                        value={localSettings.affiliateLink1 || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, affiliateLink1: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', marginTop: '16px' }}>
                    <Save size={16} />
                    <span>Save AdSense Settings</span>
                  </button>
                </div>
              </form>
            )}

            {/* Sub-tab 2: Affiliate Link Registry */}
            {monetizationSubTab === 'affiliates' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }} className="grid-responsive-split">
                {/* Form Column */}
                <form onSubmit={handleSaveAffiliateLink} className="admin-form-editor" style={{ height: 'fit-content' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px' }}>
                    {editingLink ? 'Edit Affiliate Link' : 'Register Affiliate Link'}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="form-label">Link Title*</label>
                      <input
                        type="text"
                        value={newLinkTitle}
                        onChange={(e) => {
                          setNewLinkTitle(e.target.value);
                          if (!editingLink) {
                            setNewLinkSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                          }
                        }}
                        className="form-control"
                        required
                        placeholder="e.g. Bluehost Hosting Discount"
                      />
                    </div>

                    <div>
                      <label className="form-label">Slug (Redirect Key)*</label>
                      <input
                        type="text"
                        value={newLinkSlug}
                        onChange={(e) => setNewLinkSlug(e.target.value)}
                        className="form-control"
                        required
                        placeholder="e.g. bluehost"
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Redirect URL: {window.location.origin}/go/{newLinkSlug}
                      </span>
                    </div>

                    <div>
                      <label className="form-label">Target Affiliate URL*</label>
                      <input
                        type="url"
                        value={newLinkTargetUrl}
                        onChange={(e) => setNewLinkTargetUrl(e.target.value)}
                        className="form-control"
                        required
                        placeholder="https://affiliate.bluehost.com/track?id=..."
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                        <Save size={16} />
                        <span>{editingLink ? 'Update Link' : 'Register Link'}</span>
                      </button>
                      {editingLink && (
                        <button type="button" onClick={() => {
                          setEditingLink(null);
                          setNewLinkTitle('');
                          setNewLinkSlug('');
                          setNewLinkTargetUrl('');
                        }} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                {/* List Column */}
                <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px' }}>Registered Links</h3>
                  {affiliateLinks.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
                      No affiliate links registered yet.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Link Title</th>
                            <th>Slug</th>
                            <th>Target URL</th>
                            <th>Clicks</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {affiliateLinks.map(link => (
                            <tr key={link.id}>
                              <td style={{ fontWeight: '700' }}>{link.title}</td>
                              <td><code style={{ fontSize: '0.85rem' }}>/go/{link.slug}</code></td>
                              <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.target_url}</span></td>
                              <td><span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>{link.clicks || 0} clicks</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => handleEditAffiliateLink(link)} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
                                  <button onClick={() => handleDeleteAffiliateLink(link.id)} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab 3: Monetization & Earnings Dashboard */}
            {monetizationSubTab === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Est. AdSense Earnings</span>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', marginTop: '8px' }}>
                      ${(articles.reduce((sum, a) => sum + (a.views || 0), 0) * 0.005).toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Calculated at mock $5.00 RPM</span>
                  </div>

                  <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Est. Affiliate Earnings</span>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', marginTop: '8px' }}>
                      ${(affiliateLinks.reduce((sum, l) => sum + (l.clicks || 0), 0) * 1.5).toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Calculated at mock $1.50 per conversion click</span>
                  </div>

                  <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Sponsorship Revenue</span>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#8b5cf6', marginTop: '8px' }}>
                      ${(articles.filter(a => a.is_sponsored).length * 150.0).toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Calculated at $150.00 per sponsored article slot</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }} className="grid-responsive-split">
                  {/* Revenue Projection Area Chart (SVG) */}
                  <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px' }}>Monthly Earnings Projection</h3>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 10px 0 10px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)', position: 'relative' }}>
                      {/* Projection Bars */}
                      {[
                        { month: 'Jan', rev: 450 },
                        { month: 'Feb', rev: 520 },
                        { month: 'Mar', rev: 610 },
                        { month: 'Apr', rev: 580 },
                        { month: 'May', rev: 720 },
                        { month: 'Jun', rev: 890 }
                      ].map((item, idx) => {
                        const heightPct = (item.rev / 1000) * 90;
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--primary)' }}>${item.rev}</span>
                            <div style={{
                              width: '70%',
                              height: `${heightPct}%`,
                              background: 'linear-gradient(to top, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.35))',
                              borderTop: '2px solid var(--primary)',
                              borderRadius: '2px 2px 0 0'
                            }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sponsorship Booking Calculator */}
                  <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '12px' }}>Sponsorship Booking</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                      Pre-book premium homepage banner, newsletter campaigns, or sponsored content slots.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.85rem', padding: '8px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <span>Homepage Banner</span>
                        <strong>$100 / wk</strong>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.85rem', padding: '8px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <span>Newsletter Sponsorship</span>
                        <strong>$80 / issue</strong>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.85rem', padding: '8px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <span>Sponsored Post Slot</span>
                        <strong>$150 / slot</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Sitemap generation */}
        {activeTab === 'sitemap' && (
          <div>
            <div className="pane-header">
              <h2 className="pane-title">Sitemap.xml Generator</h2>
            </div>

            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><Download size={56} /></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '8px' }}>Google SEO Friendly XML Sitemap</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', margin: '0 auto 24px', fontSize: '0.925rem', lineHeight: '1.6' }}>
                Download a valid XML sitemap containing all active links, categories, and articles. You can upload this directly to your Google Search Console to index your website pages faster in search results.
              </p>

              <button onClick={handleDownloadSitemap} className="btn btn-primary">
                <Download size={18} />
                <span>Download sitemap.xml</span>
              </button>

              <div style={{ marginTop: '40px', textAlign: 'left', background: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '10px' }}>Sitemap Preview:</h4>
                <pre style={{ fontSize: '0.75rem', overflowX: 'auto', maxHeight: '200px', padding: '10px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>
                  {generateSitemapXml()}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Subscribers management */}
        {activeTab === 'subscribers' && (
          <div className="anim-fade-in">
            <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="pane-title">Newsletter & Subscribers</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSubscribersView('list')}
                  className={`btn ${subscribersView === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Subscribers List
                </button>
                <button
                  type="button"
                  onClick={() => setSubscribersView('broadcast')}
                  className={`btn ${subscribersView === 'broadcast' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Broadcast Campaign
                </button>
                {subscribersView === 'list' && (
                  <button onClick={handleExportCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download size={16} />
                    <span>Export CSV</span>
                  </button>
                )}
              </div>
            </div>

            {subscribersView === 'list' ? (
              <>
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search subscribers by email..."
                    value={searchSubQuery}
                    onChange={(e) => setSearchSubQuery(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '40px' }}
                  />
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} />
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email Address</th>
                        <th>Subscribed Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscribers.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                            {searchSubQuery ? `No subscribers found matching "${searchSubQuery}"` : 'No subscribers found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredSubscribers.map((sub) => (
                          <tr key={sub.id}>
                            <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              {sub.email}
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {new Date(sub.subscribed_at || sub.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </td>
                            <td>
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                padding: '4px 10px', 
                                borderRadius: '9999px', 
                                fontSize: '0.75rem', 
                                fontWeight: '600',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                                color: '#10b981' 
                              }}>
                                {sub.status || 'Active'}
                              </span>
                            </td>
                            <td className="admin-actions-cell" style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteSubscriber(sub.id)}
                                className="action-icon-btn action-delete"
                                title="Delete Subscriber"
                                style={{ marginLeft: 'auto' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="grid-responsive-split">
                {/* Left: Compose Form */}
                <form onSubmit={handleSendBroadcast} className="admin-form-editor">
                  <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Compose Newsletter Broadcast</h3>
                  
                  <div>
                    <label className="form-label">Subject Line*</label>
                    <input
                      type="text"
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                      className="form-control"
                      placeholder="e.g. Weekly Tech Round-Up - June 2026"
                      required
                      disabled={sendingBroadcast}
                    />
                  </div>

                  <div>
                    <label className="form-label">Email Body Content (Markdown/HTML/Text)*</label>
                    <textarea
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      className="form-control"
                      style={{ minHeight: '200px' }}
                      placeholder="Enter the newsletter content here..."
                      required
                      disabled={sendingBroadcast}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={sendingBroadcast || subscribers.length === 0}>
                    {sendingBroadcast ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        Sending to {subscribers.length} subscribers...
                      </span>
                    ) : (
                      <>
                        <Mail size={16} />
                        <span>Send Broadcast ({subscribers.length} Subscribers)</span>
                      </>
                    )}
                  </button>
                  {subscribers.length === 0 && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0 }}>
                      No active subscribers to send newsletter to.
                    </p>
                  )}
                </form>

                {/* Right: Broadcast History Logs */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px' }}>Campaign Broadcast Logs</h3>
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Sent To</th>
                          <th style={{ textAlign: 'right' }}>Date Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.length === 0 ? (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
                              No previous campaigns found.
                            </td>
                          </tr>
                        ) : (
                          campaigns.map((camp) => (
                            <tr key={camp.id}>
                              <td style={{ fontWeight: '600' }}>{camp.subject}</td>
                              <td>{camp.sent_to || 0} subscribers</td>
                              <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                {new Date(camp.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Comments Management */}
        {activeTab === 'comments' && (
          <div className="anim-fade-in">
            <div className="pane-header" style={{ marginBottom: '24px' }}>
              <h2 className="pane-title">Comments Moderation</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Approve, reject, or delete user comments left on articles.</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flexGrow: 1, position: 'relative', minWidth: '240px' }}>
                <input
                  type="text"
                  placeholder="Search comments by author or content..."
                  value={searchCommQuery}
                  onChange={(e) => setSearchCommQuery(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                />
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} />
                </span>
              </div>
              <div style={{ width: '220px' }}>
                <select
                  value={filterCommArticle}
                  onChange={(e) => setFilterCommArticle(e.target.value)}
                  className="form-control"
                >
                  <option value="">-- All Articles --</option>
                  {articles.map(art => (
                    <option key={art.id} value={art.id}>{art.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ width: '180px' }}>
                <select
                  value={filterCommStatus}
                  onChange={(e) => setFilterCommStatus(e.target.value)}
                  className="form-control"
                >
                  <option value="all">-- All Statuses --</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div style={{ width: '200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="date"
                  value={filterCommDate}
                  onChange={(e) => setFilterCommDate(e.target.value)}
                  className="form-control"
                  title="Filter comments by creation date"
                />
                {filterCommDate && (
                  <button 
                    type="button"
                    onClick={() => setFilterCommDate('')} 
                    className="btn btn-outline" 
                    style={{ padding: '8px', fontSize: '0.8rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Clear date filter"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Article Title</th>
                    <th>Author Name</th>
                    <th>Comment Content</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comments
                    .filter(c => {
                      const matchesSearch = (c.author_name || '').toLowerCase().includes(searchCommQuery.toLowerCase()) || 
                                            (c.content || '').toLowerCase().includes(searchCommQuery.toLowerCase());
                      const matchesArticle = filterCommArticle ? String(c.article_id) === String(filterCommArticle) : true;
                      const matchesDate = filterCommDate ? new Date(c.created_at).toLocaleDateString() === new Date(filterCommDate).toLocaleDateString() : true;
                      const matchesStatus = filterCommStatus === 'all' ? true : (c.status || 'pending').toLowerCase() === filterCommStatus.toLowerCase();
                      return matchesSearch && matchesArticle && matchesDate && matchesStatus;
                    })
                    .length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          No comments found matching the filters.
                        </td>
                      </tr>
                    ) : (
                      comments
                        .filter(c => {
                          const matchesSearch = (c.author_name || '').toLowerCase().includes(searchCommQuery.toLowerCase()) || 
                                                (c.content || '').toLowerCase().includes(searchCommQuery.toLowerCase());
                          const matchesArticle = filterCommArticle ? String(c.article_id) === String(filterCommArticle) : true;
                          const matchesDate = filterCommDate ? new Date(c.created_at).toLocaleDateString() === new Date(filterCommDate).toLocaleDateString() : true;
                          const matchesStatus = filterCommStatus === 'all' ? true : (c.status || 'pending').toLowerCase() === filterCommStatus.toLowerCase();
                          return matchesSearch && matchesArticle && matchesDate && matchesStatus;
                        })
                        .map((c) => {
                          const articleTitle = articles.find(art => String(art.id) === String(c.article_id))?.title || 'Unknown Article';
                          return (
                            <tr key={c.id}>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={articleTitle}>
                                {articleTitle}
                              </td>
                              <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                {c.author_name}
                              </td>
                              <td style={{ fontSize: '0.85rem', color: 'var(--text-primary)', maxWidth: '300px', wordBreak: 'break-word' }}>
                                {c.content}
                              </td>
                              <td>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  backgroundColor: (c.status || 'pending') === 'approved' ? 'rgba(16, 185, 129, 0.1)' : (c.status || 'pending') === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                  color: (c.status || 'pending') === 'approved' ? '#10b981' : (c.status || 'pending') === 'rejected' ? '#ef4444' : '#f59e0b',
                                  textTransform: 'uppercase'
                                }}>
                                  {c.status || 'pending'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="admin-actions-cell" style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  {(c.status || 'pending') !== 'approved' && (
                                    <button
                                      onClick={() => handleApproveComment(c.id)}
                                      className="action-icon-btn action-edit"
                                      title="Approve Comment"
                                      style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none' }}
                                    >
                                      <Check size={12} />
                                    </button>
                                  )}
                                  {(c.status || 'pending') !== 'rejected' && (
                                    <button
                                      onClick={() => handleRejectComment(c.id)}
                                      className="action-icon-btn action-edit"
                                      title="Reject Comment"
                                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none' }}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="action-icon-btn action-delete"
                                    title="Delete Comment"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: Contact Messages Panel */}
        {activeTab === 'messages' && (
          <div className="anim-fade-in">
            <div className="pane-header" style={{ marginBottom: '24px' }}>
              <h2 className="pane-title">Contact Messages</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Read and manage inquiries submitted by website visitors.</p>
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search messages by name, email, subject, content..."
                value={searchMsgQuery}
                onChange={(e) => setSearchMsgQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '40px' }}
              />
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Search size={16} />
              </span>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Email</th>
                    <th>Subject & Message</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages
                    .filter(m => 
                      m.name.toLowerCase().includes(searchMsgQuery.toLowerCase()) ||
                      m.email.toLowerCase().includes(searchMsgQuery.toLowerCase()) ||
                      m.subject.toLowerCase().includes(searchMsgQuery.toLowerCase()) ||
                      m.message.toLowerCase().includes(searchMsgQuery.toLowerCase())
                    )
                    .length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          No contact messages found.
                        </td>
                      </tr>
                    ) : (
                      messages
                        .filter(m => 
                          m.name.toLowerCase().includes(searchMsgQuery.toLowerCase()) ||
                          m.email.toLowerCase().includes(searchMsgQuery.toLowerCase()) ||
                          m.subject.toLowerCase().includes(searchMsgQuery.toLowerCase()) ||
                          m.message.toLowerCase().includes(searchMsgQuery.toLowerCase())
                        )
                        .map((msg) => (
                          <tr key={msg.id} style={{ fontWeight: msg.status === 'unread' ? 'bold' : 'normal', backgroundColor: msg.status === 'unread' ? 'rgba(37, 99, 235, 0.02)' : 'transparent' }}>
                            <td>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {msg.status === 'unread' && <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--primary)', borderRadius: '50%' }}></span>}
                                {msg.name}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {msg.email}
                            </td>
                            <td style={{ maxWidth: '350px' }}>
                              <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>{msg.subject}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {msg.message}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="admin-actions-cell" style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                {msg.status === 'unread' && (
                                  <button
                                    onClick={() => handleMarkMessageRead(msg.id)}
                                    className="action-icon-btn action-edit"
                                    title="Mark as Read"
                                    style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', border: 'none' }}
                                  >
                                    <Check size={12} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="action-icon-btn action-delete"
                                  title="Delete Message"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 8: Users Management Panel */}
        {activeTab === 'users' && (
          <div className="anim-fade-in">
            <div className="pane-header" style={{ marginBottom: '24px' }}>
              <h2 className="pane-title">Registered Accounts</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>View, search, or update credentials and roles for system accounts.</p>
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '40px' }}
              />
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Search size={16} />
              </span>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Account Role</th>
                    <th>Signed Up</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList
                    .filter(u => 
                      u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                      (u.full_name && u.full_name.toLowerCase().includes(searchUserQuery.toLowerCase()))
                    )
                    .length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          No registered users found.
                        </td>
                      </tr>
                    ) : (
                      usersList
                        .filter(u => 
                          u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                          (u.full_name && u.full_name.toLowerCase().includes(searchUserQuery.toLowerCase()))
                        )
                        .map((usr) => (
                          <tr key={usr.id}>
                            <td>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img
                                  src={usr.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${usr.email}`}
                                  alt=""
                                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border-color)' }}
                                />
                                <span style={{ fontWeight: '600' }}>{usr.full_name || 'DigiLokam User'}</span>
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{usr.email}</td>
                            <td>
                              <select
                                value={usr.role || 'user'}
                                onChange={(e) => handleUpdateUserRole(usr.id, e.target.value, usr.email)}
                                className="form-control"
                                style={{ width: '110px', padding: '4px 8px', fontSize: '0.8rem', height: 'auto' }}
                                disabled={usr.email === 'admin@digilokam.com'}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {usr.created_at ? new Date(usr.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Seeded'}
                            </td>
                            <td className="admin-actions-cell" style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteUser(usr.id, usr.email)}
                                className="action-icon-btn action-delete"
                                title="Delete User"
                                style={{ marginLeft: 'auto' }}
                                disabled={usr.email === 'admin@digilokam.com'}
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 9: General Settings Panel */}
        {activeTab === 'settings' && (
          <div className="anim-fade-in">
            <div className="pane-header" style={{ marginBottom: '24px' }}>
              <h2 className="pane-title">General Website Configurations</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Customize global variables, support details, and metadata elements.</p>
            </div>

            <form onSubmit={handleSaveSiteSettings} className="admin-form-editor">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="admin-form-row">
                  <div>
                    <label className="form-label">Site Name*</label>
                    <input
                      type="text"
                      value={siteSettings.siteName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                      className="form-control"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Site Tagline*</label>
                    <input
                      type="text"
                      value={siteSettings.siteTagline}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteTagline: e.target.value })}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label className="form-label">Support Email Address*</label>
                    <input
                      type="email"
                      value={siteSettings.supportEmail}
                      onChange={(e) => setSiteSettings({ ...siteSettings, supportEmail: e.target.value })}
                      className="form-control"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">WhatsApp Contact Number*</label>
                    <input
                      type="text"
                      value={siteSettings.whatsappNumber}
                      onChange={(e) => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Footer Copyright Text*</label>
                  <input
                    type="text"
                    value={siteSettings.copyrightText}
                    onChange={(e) => setSiteSettings({ ...siteSettings, copyrightText: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', marginTop: '10px' }}>
                  <Save size={16} />
                  <span>Save General Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab: System Logs Panel */}
        {activeTab === 'logs' && (
          <div className="anim-fade-in">
            <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="pane-title">System Error Logs</h2>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to clear local logs? Database logs cannot be cleared directly for audit purposes.')) {
                    localStorage.removeItem('digilokam_error_logs');
                    setErrorLogs([]);
                    triggerAlert('Local logs cleared!', 'success');
                  }
                }}
                className="btn btn-secondary"
              >
                Clear Local Logs
              </button>
            </div>
            
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Message</th>
                    <th>Stack Trace</th>
                    <th style={{ textAlign: 'right' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {errorLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No system logs recorded.
                      </td>
                    </tr>
                  ) : (
                    errorLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 'bold' }}>{log.component || 'Global'}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: '500' }}>{log.error_message}</td>
                        <td>
                          {log.error_stack ? (
                            <pre style={{
                              maxHeight: '120px',
                              overflowY: 'auto',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              padding: '8px',
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              margin: 0
                            }}>
                              {log.error_stack}
                            </pre>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>No trace</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Media Library Panel */}
        {activeTab === 'media' && (
          <div className="anim-fade-in">
            <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="pane-title">Media Library Gallery</h2>
              <div>
                <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Upload size={16} />
                  <span>{uploadingMedia ? 'Uploading Image...' : 'Upload New Asset'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMediaUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingMedia}
                  />
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '16px' }}>
              {mediaItems.length === 0 ? (
                <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <Image size={48} style={{ margin: '0 auto 16px', color: 'var(--border-color)' }} />
                  <p>Your media library is empty. Upload images here to reuse in your publications.</p>
                </div>
              ) : (
                mediaItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ position: 'relative', height: '140px', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img
                        src={item.file_url}
                        alt={item.file_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </div>
                    
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }} title={item.file_name}>
                        {item.file_name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Size: {item.file_size ? (item.file_size / 1024).toFixed(1) + ' KB' : 'N/A'}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.file_url);
                            triggerAlert('Media URL copied to clipboard!', 'success');
                          }}
                          className="btn btn-outline"
                          style={{ flexGrow: 1, padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <Link size={12} />
                          <span>Copy URL</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item.id)}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Delete Asset"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="anim-fade-in">
            <div className="pane-header">
              <h2 className="pane-title">Google Web Stories Creator</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="grid-responsive-split">
              {/* Left Column: Creator Form */}
              <form onSubmit={handleSaveStory} className="admin-form-editor" style={{ height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px' }}>
                  {editingStory ? 'Edit Web Story' : 'Create New Web Story'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label className="form-label">Story Title*</label>
                    <input
                      type="text"
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      className="form-control"
                      required
                      placeholder="e.g. 5 Best Free AI Video Generators in 2026"
                    />
                  </div>

                  <div>
                    <label className="form-label">Cover Image URL*</label>
                    <input
                      type="text"
                      value={storyCoverUrl}
                      onChange={(e) => setStoryCoverUrl(e.target.value)}
                      className="form-control"
                      required
                      placeholder="https://example.com/cover.jpg"
                    />
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0 }}>Story Pages ({storyPages.length})</h4>
                      <button type="button" onClick={handleAddStoryPage} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto' }}>
                        + Add Page
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                      {storyPages.map((page, idx) => (
                        <div key={idx} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', textAlign: 'left' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Page {idx + 1}</span>
                          {storyPages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStoryPage(idx)}
                              style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Remove
                            </button>
                          )}
                          <div>
                            <input
                              type="text"
                              value={page.image_url}
                              onChange={(e) => handleStoryPageChange(idx, 'image_url', e.target.value)}
                              className="form-control"
                              placeholder="Page Image URL"
                              required
                              style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                            />
                          </div>
                          <div>
                            <textarea
                              value={page.text}
                              onChange={(e) => handleStoryPageChange(idx, 'text', e.target.value)}
                              className="form-control"
                              placeholder="Page Text Overlay Description"
                              required
                              style={{ minHeight: '60px', fontSize: '0.8rem', padding: '6px 8px' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                      <Save size={16} />
                      <span>{editingStory ? 'Update Story' : 'Publish Story'}</span>
                    </button>
                    {editingStory && (
                      <button type="button" onClick={() => {
                        setEditingStory(null);
                        setStoryTitle('');
                        setStoryCoverUrl('');
                        setStoryPages([{ image_url: '', text: '' }]);
                      }} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* Right Column: Stories List */}
              <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px' }}>Published Stories</h3>
                {stories.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
                    No Google Web Stories published yet.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                    {stories.map(story => (
                      <div key={story.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                          <img src={story.cover_url} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textAlign: 'left' }}>{story.title}</span>
                          </div>
                        </div>
                        <div style={{ padding: '8px', display: 'flex', gap: '4px', justifyContent: 'stretch' }}>
                          <button onClick={() => handleEditStory(story)} className="btn btn-outline" style={{ flexGrow: 1, padding: '4px', fontSize: '0.7rem', height: 'auto' }}>Edit</button>
                          <button onClick={() => handleDeleteStory(story.id)} className="btn btn-outline" style={{ padding: '4px', fontSize: '0.7rem', color: 'var(--danger)', height: 'auto' }}>Del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </main>
</div>
  );
}
