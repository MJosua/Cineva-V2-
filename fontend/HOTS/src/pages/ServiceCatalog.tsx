
import React, { useState, useEffect } from 'react';
import { Monitor, Lightbulb, Wrench, Database, Plane, FileText, Users, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from '@/components/layout/AppLayout';
import { searchInObject } from '@/utils/searchUtils';
import { renderHighlightedText } from '@/utils/renderhighlight';
import { useCatalogData } from '@/hooks/useCatalogData';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { fetchTaskCount } from '@/store/slices/ticketsSlice';


// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  'IT': Monitor,
  'Marketing': Database,
  'General': Wrench,
  'HRGA': Users,
  'Accounting': FileText,
  'Freight': FileText,
};


// Color mapping for categories
const categoryColors: Record<string, string> = {
  'IT': 'bg-orange-100 text-orange-600',
  'Marketing': 'bg-purple-100 text-purple-600',
  'General': 'bg-blue-100 text-blue-600',
  'HRGA': 'bg-green-100 text-green-600',
  'Accounting': 'bg-pink-100 text-pink-600',
  'Freight': 'bg-indigo-100 text-indigo-600',
};

// Service icon mapping
const serviceIcons: Record<string, any> = {
  'PC/Notebook Request': Monitor,
  'Idea Bank': Lightbulb,
  'IT Technical Support': Wrench,
  'Data Revision and Update Request': Database,
  'Business Trip Form': Plane,
  'Travel Expense Settlement': CreditCard,
  'New Employee Request': Users,
  'Sample Request Form': FileText,
  'Payment Advance Request': CreditCard,
};

const ServiceCatalog = () => {
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate(); // Move this to the top, before any conditional returns

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchTaskCount())
  }, [dispatch]);

  const {
    serviceCatalog,
    categoryList,
    isLoading,
    error,
    fetchData,
    getCategoryName
  } = useCatalogData();

  // Fetch real data from API on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Group services by category for rendering
  const serviceCategories = categoryList.map(category => {
    const categoryServices = serviceCatalog.filter(service =>
      service.category_id === category.category_id &&
      service.active === 1 &&
      searchInObject(service, searchValue)
    );

    return {
      title: category.category_name,
      icon: categoryIcons[category.category_name] || FileText,
      color: categoryColors[category.category_name] || 'bg-gray-100 text-gray-600',
      services: categoryServices.map(service => ({
        title: service.service_name,
        description: service.service_description,
        icon: serviceIcons[service.service_name] || FileText,
        color: categoryColors[category.category_name] || 'bg-gray-100 text-gray-600',
        url: `/${service.nav_link}`
      }))
    };
  }).filter(category => category.services.length > 0);

  const SkeletonCard = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-2/3 mb-3" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <AppLayout searchValue={searchValue} onSearchChange={setSearchValue} searchPlaceholder="Search services...">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service Catalog</h1>
              <p className="text-gray-600">Browse and request services available in HOTS</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Create skeleton categories */}
            {[1, 2, 3].map((categoryIndex) => (
              <div key={categoryIndex}>
                <div className="flex items-center space-x-3 mb-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="h-6 w-32" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((serviceIndex) => (
                    <SkeletonCard key={serviceIndex} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error loading catalog: {error}</div>
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout searchValue={searchValue} onSearchChange={setSearchValue} searchPlaceholder="Search services...">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Catalog</h1>
            <p className="text-gray-600">Browse and request services available in HOTS</p>
          </div>
        </div>

        <div className="space-y-8">
          {serviceCategories.map((category) => (
            <div key={category.title}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg ${category.color}`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.services.map((service) => (




                  <Card key={service.title} className="hover:shadow-md transition-shadow cursor-pointer">

                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-4">
                        {/* Icon Container */}
                        <div
                          className={`flex items-center justify-center w-9 h-9 rounded-lg ${category.color}`}
                        >
                          <service.icon className="w-5 h-5" />
                        </div>

                        {/* Title Text */}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                            {renderHighlightedText(service.title, searchValue)}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>




                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(`/service-catalog${service.url}`)}
                      >
                        Request Service
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default ServiceCatalog;
