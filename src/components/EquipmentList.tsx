import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameState } from '@/types/game';
import { availableEquipment, equipmentCategories, EraAvailableEquipment } from '@/data/equipment';
import { Search, Filter, Star, Zap, Calendar } from 'lucide-react';

interface EquipmentListProps {
  purchaseEquipment: (equipmentId: string) => void;
  gameState: GameState;
}

type SortOption = 'price' | 'name' | 'category' | 'year' | 'quality';
type FilterOption = 'all' | 'affordable' | 'premium' | 'vintage' | 'available';

export const EquipmentList: React.FC<EquipmentListProps> = ({
  purchaseEquipment,
  gameState
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  // Get equipment available for current era/year - simple filter for now
  const eraFilteredEquipment = useMemo(() => {
    const currentYear = gameState.currentYear || 2024;
    return availableEquipment.filter(equipment => {
      const availableFrom = equipment.availableFrom <= currentYear;
      const notObsolete = !equipment.availableUntil || equipment.availableUntil >= currentYear;
      return availableFrom && notObsolete;
    });
  }, [gameState.currentYear]);
  
  // Filter equipment by ownership and requirements
  const unownedEquipment = useMemo(() => {
    return eraFilteredEquipment.filter(equipment => {
      // Already owned check
      if (gameState.ownedEquipment.some(owned => owned.id === equipment.id)) {
        return false;
      }
      
      // Skill requirement check - but be more lenient for historical progression
      if (equipment.skillRequirement) {
        const skill = gameState.studioSkills[equipment.skillRequirement.skill];
        if (!skill || skill.level < equipment.skillRequirement.level) {
          // For historical eras (before 2000), allow basic equipment even if skill level isn't met
          const isHistoricalEra = (gameState.currentYear || 2024) < 2000;
          const isBasicEquipment = equipment.skillRequirement.level <= 2;
          
          if (!(isHistoricalEra && isBasicEquipment)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }, [eraFilteredEquipment, gameState.ownedEquipment, gameState.studioSkills, gameState.currentYear]);

  const getAdjustedPrice = (equipment: EraAvailableEquipment) => {
    let basePrice = equipment.price;
    
    // Apply era multiplier
    const eraMultiplier = gameState.equipmentMultiplier || 1.0;
    
    // If it's vintage equipment and we're in a later era, make it more expensive
    if (equipment.isVintage && gameState.currentYear && gameState.currentYear > (equipment.availableUntil || equipment.availableFrom + 20)) {
      const vintageMultiplier = Math.min(3.0, 1 + ((gameState.currentYear - (equipment.availableUntil || equipment.availableFrom + 20)) / 20));
      basePrice *= vintageMultiplier;
    }
    
    return Math.round(basePrice * eraMultiplier);
  };

  const getQualityScore = (equipment: EraAvailableEquipment) => {
    const bonuses = equipment.bonuses;
    return (bonuses.qualityBonus || 0) + (bonuses.technicalBonus || 0) + (bonuses.creativityBonus || 0);
  };

  // Advanced filtering and sorting
  const filteredAndSortedEquipment = useMemo(() => {
    let filtered = unownedEquipment;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(equipment =>
        equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(equipment => equipment.category === selectedCategory);
    }

    // Price and special filters
    switch (filterBy) {
      case 'affordable':
        filtered = filtered.filter(equipment => getAdjustedPrice(equipment) <= gameState.money);
        break;
      case 'premium':
        filtered = filtered.filter(equipment => getAdjustedPrice(equipment) >= 5000);
        break;
      case 'vintage':
        filtered = filtered.filter(equipment => equipment.isVintage || equipment.availableFrom < 1990);
        break;
      case 'available':
        filtered = filtered.filter(equipment => getAdjustedPrice(equipment) <= gameState.money);
        break;
    }

    // Price range filter
    filtered = filtered.filter(equipment => {
      const price = getAdjustedPrice(equipment);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sorting
    filtered = filtered.slice().sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return getAdjustedPrice(a) - getAdjustedPrice(b);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'year':
          return a.availableFrom - b.availableFrom;
        case 'quality':
          return getQualityScore(b) - getQualityScore(a);
        default:
          return 0;
      }
    });

    return filtered;
  }, [unownedEquipment, searchTerm, selectedCategory, sortBy, filterBy, priceRange, gameState.money]);

  // Group equipment by category for tabbed view
  const groupedEquipment = useMemo(() => {
    const grouped: { [key: string]: EraAvailableEquipment[] } = {};
    
    Object.keys(equipmentCategories).forEach(category => {
      if (category === 'all') return;
      grouped[category] = filteredAndSortedEquipment.filter(eq => eq.category === category);
    });
    
    return grouped;
  }, [filteredAndSortedEquipment]);

  const getPriceColor = (equipment: EraAvailableEquipment) => {
    const price = getAdjustedPrice(equipment);
    const canAfford = gameState.money >= price;
    
    if (!canAfford) return 'text-red-400';
    if (price < 1000) return 'text-green-400';
    if (price < 5000) return 'text-yellow-400';
    return 'text-purple-400';
  };

  const getEquipmentBadges = (equipment: EraAvailableEquipment) => {
    const badges = [];
    const price = getAdjustedPrice(equipment);
    
    if (equipment.isVintage) badges.push({ text: 'VINTAGE', color: 'bg-yellow-600/20 text-yellow-400' });
    if (price >= 10000) badges.push({ text: 'PREMIUM', color: 'bg-purple-600/20 text-purple-400' });
    if (equipment.availableFrom >= 2020) badges.push({ text: 'MODERN', color: 'bg-blue-600/20 text-blue-400' });
    if (equipment.skillRequirement && equipment.skillRequirement.level >= 5) {
      badges.push({ text: 'PRO', color: 'bg-red-600/20 text-red-400' });
    }
    
    return badges;
  };

  const EquipmentCard = ({ equipment }: { equipment: EraAvailableEquipment }) => {
    const adjustedPrice = getAdjustedPrice(equipment);
    const canAfford = gameState.money >= adjustedPrice;
    const badges = getEquipmentBadges(equipment);
    const qualityScore = getQualityScore(equipment);

    return (
      <Card key={equipment.id} className="p-4 bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{equipment.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white">{equipment.name}</h4>
                  {badges.map((badge, index) => (
                    <Badge key={index} className={`text-xs ${badge.color}`}>
                      {badge.text}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  {equipment.description}
                </p>
                
                {/* Equipment stats preview */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{equipment.availableFrom}</span>
                  </div>
                  {qualityScore > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      <span>+{qualityScore} Quality</span>
                    </div>
                  )}
                  {equipment.bonuses.speedBonus && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>+{equipment.bonuses.speedBonus} Speed</span>
                    </div>
                  )}
                </div>

                {/* Genre bonuses */}
                {equipment.bonuses.genreBonus && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(equipment.bonuses.genreBonus).map(([genre, bonus]) => (
                      <Badge key={genre} className="text-xs bg-blue-600/20 text-blue-400">
                        {genre} +{bonus}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Skill requirement */}
                {equipment.skillRequirement && (
                  <div className="text-xs text-blue-400">
                    📈 Requires {equipment.skillRequirement.skill} Level {equipment.skillRequirement.level}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right ml-4">
            <div className={`font-bold text-lg ${getPriceColor(equipment)} mb-2`}>
              ${adjustedPrice.toLocaleString()}
            </div>
            <Button
              size="sm"
              onClick={() => purchaseEquipment(equipment.id)}
              disabled={!canAfford}
              className={`w-full transition-colors ${
                canAfford 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {canAfford ? 'Purchase' : 'Too Expensive'}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with search and filters */}
      <div className="mb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            🛒 Equipment Shop
            <Badge className="bg-blue-600/20 text-blue-400">
              {filteredAndSortedEquipment.length} items
            </Badge>
          </h3>
          <div className="text-sm text-gray-400">
            💰 ${gameState.money.toLocaleString()} available
          </div>
        </div>

        {/* Search and main filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-600 text-white"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {Object.entries(equipmentCategories).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600 text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="price" className="text-white hover:bg-gray-700">Price</SelectItem>
              <SelectItem value="name" className="text-white hover:bg-gray-700">Name</SelectItem>
              <SelectItem value="category" className="text-white hover:bg-gray-700">Category</SelectItem>
              <SelectItem value="year" className="text-white hover:bg-gray-700">Year</SelectItem>
              <SelectItem value="quality" className="text-white hover:bg-gray-700">Quality</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="all" className="text-white hover:bg-gray-700">All Items</SelectItem>
              <SelectItem value="affordable" className="text-white hover:bg-gray-700">Affordable</SelectItem>
              <SelectItem value="premium" className="text-white hover:bg-gray-700">Premium</SelectItem>
              <SelectItem value="vintage" className="text-white hover:bg-gray-700">Vintage</SelectItem>
              <SelectItem value="available" className="text-white hover:bg-gray-700">Can Afford</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main content */}
      {filteredAndSortedEquipment.length === 0 ? (
        <Card className="p-8 bg-gray-800/50 border-gray-600 flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            {unownedEquipment.length === 0 ? (
              <>
                <div className="text-4xl mb-4">✅</div>
                <p className="text-lg font-semibold mb-2">All equipment purchased!</p>
                <p>You own every piece of equipment available in this era.</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg font-semibold mb-2">No equipment found</p>
                <p>Try adjusting your search or filter criteria.</p>
              </>
            )}
          </div>
        </Card>
      ) : selectedCategory === 'all' ? (
        // Show all equipment in a single list
        <div className="flex-1 overflow-y-auto space-y-3">
          {filteredAndSortedEquipment.map((equipment) => (
            <EquipmentCard key={equipment.id} equipment={equipment} />
          ))}
        </div>
      ) : (
        // Show tabbed view by category
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-7 bg-gray-800/50">
            {Object.entries(equipmentCategories).slice(1).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-xs data-[state=active]:bg-blue-600">
                {label.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(groupedEquipment).map(([category, equipmentList]) => (
            <TabsContent key={category} value={category} className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-3">
                {equipmentList.length === 0 ? (
                  <Card className="p-6 bg-gray-800/50 border-gray-600 text-center text-gray-400">
                    No {equipmentCategories[category as keyof typeof equipmentCategories].toLowerCase()} available
                  </Card>
                ) : (
                  equipmentList.map((equipment) => (
                    <EquipmentCard key={equipment.id} equipment={equipment} />
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};
