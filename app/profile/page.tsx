"use client";
import React, { useState } from "react";
import { useUserStatus } from "@/components/UserStatusContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { Loader2, Upload, CreditCard, Clock, Settings, User, FileText, BarChart3 } from "lucide-react";
import CreditHistory from "./CreditHistory";
import CreditPurchaseModal from "@/components/credit/CreditPurchaseModal";

export default function ProfilePage() {
  const { user, loading, error, refreshUser } = useUserStatus();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    brandName: "",
    logoUrl: ""
  });
  const [purchaseModalOpened, setPurchaseModalOpened] = useState(false);

  React.useEffect(() => {
    if (!user && !loading) {
      router.replace("/login");
    }
    if (user) {
      setFormData({
        email: user.email || "",
        brandName: user.brandName || "",
        logoUrl: user.logoUrl || ""
      });
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdatingProfile(true);
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Cập nhật thông tin thành công!');
        refreshUser();
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Lỗi khi cập nhật thông tin');
      }
    } catch (err) {
      toast.error('Đã xảy ra lỗi khi cập nhật thông tin');
      console.error(err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <div className="text-lg">Đang tải thông tin người dùng...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Trang Cá Nhân</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Thông tin cá nhân */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="w-24 h-24 border-2 border-primary">
                {user.logoUrl ? (
                  <AvatarImage src={user.logoUrl} alt={user.username} />
                ) : (
                  <AvatarFallback className="text-2xl">{user.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <CardTitle className="text-xl">{user.username}</CardTitle>
            <CardDescription>
              {user.brandName || "Chưa cập nhật thương hiệu"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium">{user.email || "Chưa cập nhật"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Số dư tín dụng:</span>
              <span className="font-bold text-primary">{user.credit}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">Tổng tín dụng đã dùng:</span>
              <span className="font-medium">{user.totalSpentCredits || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">Quyền hạn:</span>
              <span className={`px-3 py-1 rounded text-sm font-medium ${user.isAdmin ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                {user.isAdmin ? "Quản trị viên" : "Người dùng"}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setPurchaseModalOpened(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" /> Mua tín dụng
            </Button>
            <Button 
              variant="default" 
              className="w-full" 
              onClick={() => setIsEditing(true)}
            >
              <Settings className="mr-2 h-4 w-4" /> Cập nhật thông tin
            </Button>
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={() => {
                localStorage.removeItem("token");
                router.replace("/login");
                toast.success("Đã đăng xuất thành công");
              }}
            >
              Đăng xuất
            </Button>
          </CardFooter>
        </Card>

        {/* Tabs nội dung chính */}
        <div className="md:col-span-2">
          <Tabs defaultValue="credit-history">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="credit-history">
                <Clock className="mr-2 h-4 w-4" /> Lịch sử tín dụng
              </TabsTrigger>
              <TabsTrigger value="profile-settings">
                <User className="mr-2 h-4 w-4" /> Cài đặt tài khoản
              </TabsTrigger>
              <TabsTrigger value="statistics">
                <BarChart3 className="mr-2 h-4 w-4" /> Thống kê sử dụng
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="credit-history" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử giao dịch tín dụng</CardTitle>
                  <CardDescription>
                    Xem lịch sử sử dụng và nạp tín dụng của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CreditHistory />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="profile-settings" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt tài khoản</CardTitle>
                  <CardDescription>
                    Cập nhật thông tin cá nhân và thương hiệu của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      placeholder="Nhập email của bạn" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Tên thương hiệu</Label>
                    <Input 
                      id="brandName" 
                      name="brandName" 
                      value={formData.brandName} 
                      onChange={handleInputChange} 
                      placeholder="Nhập tên thương hiệu của bạn" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL Logo</Label>
                    <Input 
                      id="logoUrl" 
                      name="logoUrl" 
                      value={formData.logoUrl} 
                      onChange={handleInputChange} 
                      placeholder="Nhập URL logo của bạn" 
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => {
                    setFormData({
                      email: user.email || "",
                      brandName: user.brandName || "",
                      logoUrl: user.logoUrl || ""
                    });
                  }}>Hủy thay đổi</Button>
                  <Button 
                    onClick={handleUpdateProfile} 
                    disabled={updatingProfile}
                  >
                    {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lưu thay đổi
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="statistics" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê sử dụng</CardTitle>
                  <CardDescription>
                    Phân tích chi tiết việc sử dụng tín dụng của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-blue-500 text-sm font-medium mb-1">Tổng tín dụng đã dùng</div>
                        <div className="text-2xl font-bold">{user.totalSpentCredits || 0}</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-green-500 text-sm font-medium mb-1">Số dư hiện tại</div>
                        <div className="text-2xl font-bold">{user.credit}</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-purple-500 text-sm font-medium mb-1">Video đã tạo</div>
                        <div className="text-2xl font-bold">--</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <h3 className="text-lg font-medium mb-2">Báo cáo chi tiết</h3>
                      <p className="text-gray-500 mb-4">Thông tin chi tiết về việc sử dụng tín dụng sẽ được hiển thị ở đây</p>
                      <Button variant="outline">Tạo báo cáo</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Modal cập nhật thông tin */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Cập nhật thông tin</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-email">Email</Label>
                <Input 
                  id="modal-email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  placeholder="Nhập email của bạn" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-brandName">Tên thương hiệu</Label>
                <Input 
                  id="modal-brandName" 
                  name="brandName" 
                  value={formData.brandName} 
                  onChange={handleInputChange} 
                  placeholder="Nhập tên thương hiệu của bạn" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-logoUrl">URL Logo</Label>
                <Input 
                  id="modal-logoUrl" 
                  name="logoUrl" 
                  value={formData.logoUrl} 
                  onChange={handleInputChange} 
                  placeholder="Nhập URL logo của bạn" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
              <Button 
                onClick={handleUpdateProfile} 
                disabled={updatingProfile}
              >
                {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal mua tín dụng */}
      <CreditPurchaseModal 
        opened={purchaseModalOpened} 
        onClose={() => setPurchaseModalOpened(false)} 
        onPurchaseComplete={() => {
          refreshUser();
        }}
      />
    </div>
  );
}
